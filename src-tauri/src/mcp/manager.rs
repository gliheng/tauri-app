use std::collections::{HashMap, VecDeque};
use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::Emitter;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::mcp::{
    transport::{McpTransport, create_transport},
    types::{
        McpServerConfig, McpTool, McpToolCallRequest, McpToolCallResponse,
        McpResult, McpError, McpContentItem, McpLogEntry, McpLogLevel,
        McpResource, McpResourceReadRequest, McpResourceReadResponse,
        McpResourceContent,
        McpPrompt, McpPromptArgument, McpPromptGetRequest, McpPromptGetResponse,
        McpPromptMessage, McpPromptContent,
    },
};
use rmcp::{
    RoleClient,
    service::{ClientInitializeError, RunningService, serve_client},
};
use rmcp::transport::child_process::TokioChildProcess;
use rmcp::transport::streamable_http_client::StreamableHttpClientTransport;

pub struct McpManager {
    // We store the tools directly since we can't store dyn Service
    servers: Arc<RwLock<HashMap<String, ServerInfo>>>,
    app_handle: tauri::AppHandle,
}

struct ServerInfo {
    config: McpServerConfig,
    tools: Vec<McpTool>,
    resources: Vec<McpResource>,
    prompts: Vec<McpPrompt>,
    is_connected: bool,
    service: Arc<RunningService<RoleClient, ()>>,
    logs: VecDeque<McpLogEntry>,
}

const MAX_LOG_ENTRIES: usize = 1000;

impl McpManager {
    pub fn new(app_handle: tauri::AppHandle) -> Self {
        Self {
            servers: Arc::new(RwLock::new(HashMap::new())),
            app_handle,
        }
    }

    /// Start multiple MCP servers
    pub async fn start_servers(
        &self,
        server_configs: Vec<(String, McpServerConfig)>,
    ) -> McpResult<HashMap<String, Vec<String>>> {
        let mut results = HashMap::new();

        for (server_id, config) in server_configs {
            match self.start_server(server_id.clone(), config).await {
                Ok(tools) => {
                    let tool_names: Vec<String> = tools.iter().map(|t| t.name.clone()).collect();
                    results.insert(server_id, tool_names);
                }
                Err(e) => {
                    eprintln!("Failed to start server: {}", e);
                }
            }
        }

        Ok(results)
    }

    /// Start a single MCP server connection
    pub async fn start_server(
        &self,
        server_id: String,
        config: McpServerConfig,
    ) -> McpResult<Vec<McpTool>> {
        // Log server starting
        self.add_log_entry(&server_id, McpLogLevel::Info, format!("Starting MCP server: {:?}", config));
        
        // Emit connection starting event
        let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
            "serverId": server_id,
            "status": "starting",
        }));

        // Create transport
        let transport = create_transport(&config).await
            .map_err(|e| {
                self.add_log_entry(&server_id, McpLogLevel::Error, format!("Failed to create transport: {}", e));
                let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
                    "serverId": server_id,
                    "status": "failed",
                    "error": e.to_string(),
                }));
                e
            })?;

        // let _client_info = ClientInfo {
        //     protocol_version: Default::default(),
        //     capabilities: ClientCapabilities::default(),
        //     client_info: Implementation {
        //         name: "raven".into(),
        //         version: env!("CARGO_PKG_VERSION").into(),
        //     },
        // };

        // Handle each transport type and get the service
        let service = match transport {
            McpTransport::Stdio(t) => {
                self.connect_stdio(t, &server_id).await?
            }
            McpTransport::Http(t) => {
                self.connect_http(t, &server_id).await?
            }
        };

        // Check server capabilities and only extract supported features
        let capabilities = service.peer_info()
            .map(|info| &info.capabilities);

        let has_tools = capabilities.map(|c| c.tools.is_some()).unwrap_or(false);
        let has_resources = capabilities.map(|c| c.resources.is_some()).unwrap_or(false);
        let has_prompts = capabilities.map(|c| c.prompts.is_some()).unwrap_or(false);

        self.add_log_entry(&server_id, McpLogLevel::Info, 
            format!("Server capabilities - tools: {}, resources: {}, prompts: {}", has_tools, has_resources, has_prompts));

        // Extract tools, resources, and prompts based on capabilities
        let tools = if has_tools {
            self.extract_tools(&service, &server_id).await?
        } else {
            Vec::new()
        };

        let resources = if has_resources {
            self.extract_resources(&service, &server_id).await?
        } else {
            Vec::new()
        };

        let prompts = if has_prompts {
            self.extract_prompts(&service, &server_id).await?
        } else {
            Vec::new()
        };

        self.add_log_entry(&server_id, McpLogLevel::Info, format!("Successfully connected. Found {} tools, {} resources, {} prompts", tools.len(), resources.len(), prompts.len()));

        // Store the service, tools, resources, and prompts
        let mut servers = self.servers.write().await;
        servers.insert(server_id.to_string(), ServerInfo {
            config,
            tools: tools.clone(),
            resources: resources.clone(),
            prompts: prompts.clone(),
            is_connected: true,
            service: Arc::new(service),
            logs: VecDeque::new(),
        });

        // Emit success with resources and prompts
        let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
            "serverId": server_id,
            "status": "connected",
            "tools": tools,
            "resources": resources,
            "prompts": prompts,
        }));

        Ok(tools)
    }

    /// Connect via stdio transport
    async fn connect_stdio(
        &self,
        transport: TokioChildProcess,
        server_id: &str,
    ) -> McpResult<RunningService<RoleClient, ()>> {
        self.add_log_entry(server_id, McpLogLevel::Info, "Connecting via stdio transport...".to_string());

        let service = serve_client((), transport).await
            .map_err(|e: ClientInitializeError| {
                self.add_log_entry(server_id, McpLogLevel::Error, format!("Stdio connection failed: {}", e));
                let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
                    "serverId": server_id,
                    "status": "failed",
                    "error": e.to_string(),
                }));
                McpError::ProtocolError(format!("Failed to connect stdio: {}", e))
            })?;

        Ok(service)
    }

    /// Connect via HTTP transport (streamable HTTP)
    async fn connect_http(
        &self,
        transport: StreamableHttpClientTransport<reqwest::Client>,
        server_id: &str,
    ) -> McpResult<RunningService<RoleClient, ()>> {
        self.add_log_entry(server_id, McpLogLevel::Info, "Connecting via HTTP transport...".to_string());

        let service = serve_client((), transport).await
            .map_err(|e: ClientInitializeError| {
                self.add_log_entry(server_id, McpLogLevel::Error, format!("HTTP connection failed: {}", e));
                let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
                    "serverId": server_id,
                    "status": "failed",
                    "error": e.to_string(),
                }));
                McpError::ProtocolError(format!("Failed to connect HTTP: {}", e))
            })?;

        Ok(service)
    }

    /// Extract tools from a service
    async fn extract_tools(
        &self,
        service: &RunningService<RoleClient, ()>,
        server_id: &str,
    ) -> McpResult<Vec<McpTool>> {        
        // List tools from the service
        let tools_response = service.list_all_tools().await
            .map_err(|e| {
                let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
                    "serverId": server_id,
                    "status": "failed",
                    "error": e.to_string(),
                }));
                McpError::ProtocolError(format!("Failed to list tools: {}", e))
            })?;

        println!("[MCP] Extracted {} tools for server: {}", tools_response.len(), server_id);

        let tools: Vec<McpTool> = tools_response
            .into_iter()
            .map(|t| McpTool {
                name: t.name.to_string(),
                description: t.description.map(|d: std::borrow::Cow<'_, str>| d.to_string()),
                input_schema: Some(serde_json::Value::Object((*t.input_schema).clone())),
            })
            .collect();

        Ok(tools)
    }

    /// Extract resources from a service
    async fn extract_resources(
        &self,
        service: &RunningService<RoleClient, ()>,
        server_id: &str,
    ) -> McpResult<Vec<McpResource>> {
        let resources_response = service.list_all_resources().await
            .map_err(|e| {
                self.add_log_entry(server_id, McpLogLevel::Error, format!("Failed to list resources: {}", e));
                McpError::ProtocolError(format!("Failed to list resources: {}", e))
            })?;

        println!("[MCP] Extracted {} resources for server: {}", resources_response.len(), server_id);

        let resources: Vec<McpResource> = resources_response
            .into_iter()
            .map(|r| {
                // Resource is Annotated<RawResource>, access via .raw field
                McpResource {
                    uri: r.raw.uri.clone(),
                    name: r.raw.name.clone(),
                    description: r.raw.description.clone(),
                    mime_type: r.raw.mime_type.clone(),
                }
            })
            .collect();

        Ok(resources)
    }

    /// Extract prompts from a service
    async fn extract_prompts(
        &self,
        service: &RunningService<RoleClient, ()>,
        server_id: &str,
    ) -> McpResult<Vec<McpPrompt>> {
        let prompts_response = service.list_all_prompts().await
            .map_err(|e| {
                self.add_log_entry(server_id, McpLogLevel::Error, format!("Failed to list prompts: {}", e));
                McpError::ProtocolError(format!("Failed to list prompts: {}", e))
            })?;

        println!("[MCP] Extracted {} prompts for server: {}", prompts_response.len(), server_id);

        let prompts: Vec<McpPrompt> = prompts_response
            .into_iter()
            .map(|p| {
                // Prompt is not wrapped in Annotated, access fields directly
                let arguments = p.arguments
                    .unwrap_or_default()
                    .into_iter()
                    .map(|arg| McpPromptArgument {
                        name: arg.name,
                        description: arg.description,
                        required: arg.required,
                    })
                    .collect();

                McpPrompt {
                    name: p.name,
                    description: p.description,
                    arguments,
                }
            })
            .collect();

        Ok(prompts)
    }

    /// List all tools from all connected servers
    pub async fn list_tools(&self) -> McpResult<Vec<McpTool>> {
        let servers = self.servers.read().await;
        let mut all_tools = Vec::new();

        for info in servers.values() {
            if info.is_connected {
                all_tools.extend(info.tools.clone());
            }
        }

        Ok(all_tools)
    }

    /// List all resources from all connected servers
    pub async fn list_resources(&self) -> McpResult<Vec<McpResource>> {
        let servers = self.servers.read().await;
        let mut all_resources = Vec::new();

        for info in servers.values() {
            if info.is_connected {
                all_resources.extend(info.resources.clone());
            }
        }

        Ok(all_resources)
    }

    /// List all prompts from all connected servers
    pub async fn list_prompts(&self) -> McpResult<Vec<McpPrompt>> {
        let servers = self.servers.read().await;
        let mut all_prompts = Vec::new();

        for info in servers.values() {
            if info.is_connected {
                all_prompts.extend(info.prompts.clone());
            }
        }

        Ok(all_prompts)
    }

    /// Read a resource from a specific server
    pub async fn read_resource(&self, request: McpResourceReadRequest) -> McpResult<McpResourceReadResponse> {
        use rmcp::model::ReadResourceRequestParams;

        let servers = self.servers.read().await;
        let server_info = servers.get(&request.server_id)
            .ok_or_else(|| McpError::ServerNotFound(request.server_id.clone()))?;

        if !server_info.is_connected {
            return Err(McpError::ServerNotFound(format!("Server {} is not connected", request.server_id)));
        }

        self.add_log_entry(&request.server_id, McpLogLevel::Info,
            format!("Reading resource: {}", request.uri));

        let read_request = ReadResourceRequestParams {
            uri: request.uri.clone().into(),
            meta: None,
        };

        let result = server_info.service.read_resource(read_request).await
            .map_err(|e| {
                self.add_log_entry(&request.server_id, McpLogLevel::Error,
                    format!("Resource read failed: {}", e));
                McpError::ProtocolError(format!("Resource read failed: {}", e))
            })?;

        let contents = result.contents
            .into_iter()
            .map(|item| {
                use rmcp::model::ResourceContents;
                match item {
                    ResourceContents::TextResourceContents { uri, text, mime_type, .. } => {
                        McpResourceContent::Text {
                            uri: uri.to_string(),
                            text,
                            mime_type: mime_type.map(|m| m.to_string())
                        }
                    }
                    ResourceContents::BlobResourceContents { uri, blob, mime_type, .. } => {
                        McpResourceContent::Blob {
                            uri: uri.to_string(),
                            blob,
                            mime_type: mime_type.clone().unwrap_or_default()
                        }
                    }
                }
            })
            .collect();

        Ok(McpResourceReadResponse { contents })
    }

    /// Get a prompt from a specific server
    pub async fn get_prompt(&self, request: McpPromptGetRequest) -> McpResult<McpPromptGetResponse> {
        use rmcp::model::{GetPromptRequestParams, PromptMessageRole};

        let servers = self.servers.read().await;
        let server_info = servers.get(&request.server_id)
            .ok_or_else(|| McpError::ServerNotFound(request.server_id.clone()))?;

        if !server_info.is_connected {
            return Err(McpError::ServerNotFound(format!("Server {} is not connected", request.server_id)));
        }

        let args = request.arguments.and_then(|v| {
            if let serde_json::Value::Object(map) = v {
                Some(map.into_iter().map(|(k, v)| (k.into(), v)).collect())
            } else {
                None
            }
        });

        self.add_log_entry(&request.server_id, McpLogLevel::Info,
            format!("Getting prompt: {}", request.name));

        let prompt_request = GetPromptRequestParams {
            name: request.name.clone().into(),
            arguments: args,
            meta: None,
        };

        let result = server_info.service.get_prompt(prompt_request).await
            .map_err(|e| {
                self.add_log_entry(&request.server_id, McpLogLevel::Error,
                    format!("Prompt get failed: {}", e));
                McpError::ProtocolError(format!("Prompt get failed: {}", e))
            })?;

        let messages = result.messages
            .into_iter()
            .map(|msg| {
                let role = match msg.role {
                    PromptMessageRole::User => "user".to_string(),
                    PromptMessageRole::Assistant => "assistant".to_string(),
                };

                let content = match msg.content {
                    rmcp::model::PromptMessageContent::Text { text } => {
                        McpPromptContent::Text { text }
                    }
                    rmcp::model::PromptMessageContent::Image { image } => {
                        // Access fields from the Annotated wrapper
                        McpPromptContent::Image {
                            data: image.raw.data.clone(),
                            mime_type: image.raw.mime_type.clone()
                        }
                    }
                    rmcp::model::PromptMessageContent::Resource { resource } => {
                        use rmcp::model::ResourceContents;
                        // Access through the Annotated wrapper
                        match &resource.raw.resource {
                            ResourceContents::TextResourceContents { uri, .. } => {
                                McpPromptContent::Resource {
                                    uri: uri.to_string()
                                }
                            }
                            ResourceContents::BlobResourceContents { uri, .. } => {
                                McpPromptContent::Resource {
                                    uri: uri.to_string()
                                }
                            }
                        }
                    }
                    rmcp::model::PromptMessageContent::ResourceLink { link } => {
                        // Access through the Annotated wrapper
                        McpPromptContent::Resource {
                            uri: link.raw.uri.clone()
                        }
                    }
                };

                McpPromptMessage {
                    role,
                    content,
                }
            })
            .collect();

        Ok(McpPromptGetResponse { messages })
    }

    /// Call a tool on a specific server using the persistent connection
    pub async fn call_tool(&self, request: McpToolCallRequest) -> McpResult<McpToolCallResponse> {
        use rmcp::model::CallToolRequestParams;

        // Get the service from the stored connection and call the tool
        let servers = self.servers.read().await;
        let server_info = servers.get(&request.server_id)
            .ok_or_else(|| McpError::ServerNotFound(request.server_id.clone()))?;

        if !server_info.is_connected {
            return Err(McpError::ServerNotFound(format!("Server {} is not connected", request.server_id)));
        }

        // Convert arguments
        let args = match request.arguments {
            Some(serde_json::Value::Object(map)) => Some(map),
            Some(val) => {
                let mut map = serde_json::Map::new();
                map.insert("value".to_string(), val);
                Some(map)
            }
            None => None,
        };

        let tool_request = CallToolRequestParams {
            name: request.tool_name.clone().into(),
            arguments: args,
            meta: None,
            task: None,
        };

        self.add_log_entry(&request.server_id, McpLogLevel::Info, format!("Calling tool: {}", request.tool_name));

        let result = server_info.service.call_tool(tool_request).await
            .map_err(|e| {
                self.add_log_entry(&request.server_id, McpLogLevel::Error, format!("Tool call failed: {}", e));
                McpError::ToolExecutionError(format!("Tool execution failed: {}", e))
            })?;

        self.add_log_entry(&request.server_id, McpLogLevel::Info, format!("Tool call completed: {}", request.tool_name));

        // Convert rmcp content to our content format
        let content = result.content
            .into_iter()
            .map(|item| {
                use rmcp::model::RawContent;
                match item.raw {
                    RawContent::Text(text_content) => {
                        McpContentItem::Text { text: text_content.text }
                    }
                    RawContent::Image(image_content) => {
                        McpContentItem::Image {
                            data: image_content.data,
                            mime_type: image_content.mime_type
                        }
                    }
                    RawContent::Resource(resource_content) => {
                        use rmcp::model::ResourceContents;
                        // RawEmbeddedResource is already a raw type, access .resource directly
                        match &resource_content.resource {
                            ResourceContents::TextResourceContents { uri, mime_type, .. } => {
                                McpContentItem::Resource {
                                    uri: uri.clone(),
                                    mime_type: mime_type.clone()
                                }
                            }
                            ResourceContents::BlobResourceContents { uri, mime_type, .. } => {
                                McpContentItem::Resource {
                                    uri: uri.clone(),
                                    mime_type: mime_type.clone()
                                }
                            }
                        }
                    }
                    RawContent::ResourceLink(resource_link) => {
                        // RawResource is already a raw type, access fields directly
                        McpContentItem::Resource {
                            uri: resource_link.uri.clone(),
                            mime_type: resource_link.mime_type.clone()
                        }
                    }
                    RawContent::Audio(_) => {
                        // Audio content not supported in our types, convert to text
                        McpContentItem::Text { text: "[Audio content]".to_string() }
                    }
                }
            })
            .collect();

        Ok(McpToolCallResponse {
            content,
            is_error: result.is_error.unwrap_or(false),
        })
    }


    /// Stop a specific server and clean up its resources
    pub async fn stop_server(&self, server_id: &str) -> McpResult<()> {
        let mut servers = self.servers.write().await;
        
        // Remove the server, which will drop the Arc<RunningService>
        // When the last Arc reference is dropped, the service and its child processes are cleaned up
        if let Some(_server_info) = servers.remove(server_id) {
            // Emit disconnection event
            let _ = self.app_handle.emit("mcp-server-status", serde_json::json!({
                "serverId": server_id,
                "status": "disconnected",
            }));
        }
        
        Ok(())
    }

    /// Stop all servers
    pub async fn stop_all(&self) -> McpResult<()> {
        let server_ids: Vec<String> = {
            let servers = self.servers.read().await;
            servers.keys().cloned().collect()
        };

        for server_id in server_ids {
            self.stop_server(&server_id).await?;
        }

        Ok(())
    }

    /// Get list of connected server IDs
    pub async fn list_servers(&self) -> Vec<String> {
        let servers = self.servers.read().await;
        servers.keys().cloned().collect()
    }

    /// Add a log entry for a server
    fn add_log_entry(&self, server_id: &str, level: McpLogLevel, message: String) {
        let servers = self.servers.clone();
        let app_handle = self.app_handle.clone();
        let server_id = server_id.to_string();
        
        tokio::spawn(async move {
            let mut servers = servers.write().await;
            if let Some(server_info) = servers.get_mut(&server_id) {
                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as i64;
                
                let log_entry = McpLogEntry {
                    timestamp,
                    level: level.clone(),
                    message: message.clone(),
                };
                
                // Add to circular buffer
                if server_info.logs.len() >= MAX_LOG_ENTRIES {
                    server_info.logs.pop_front();
                }
                server_info.logs.push_back(log_entry.clone());
                
                // Emit log event to frontend
                let _ = app_handle.emit("mcp-server-log", serde_json::json!({
                    "serverId": server_id,
                    "log": log_entry,
                }));
            }
        });
    }

    /// Get logs for a specific server
    pub async fn get_server_logs(&self, server_id: &str) -> McpResult<Vec<McpLogEntry>> {
        let servers = self.servers.read().await;
        let server_info = servers.get(server_id)
            .ok_or_else(|| McpError::ServerNotFound(server_id.to_string()))?;
        
        Ok(server_info.logs.iter().cloned().collect())
    }
}
