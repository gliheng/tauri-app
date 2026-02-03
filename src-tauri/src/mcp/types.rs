use serde::{Deserialize, Serialize};
use thiserror::Error;

// MCP Server Configuration (mirrors frontend types)
// Note: Only stdio transport is currently supported due to rmcp dependency limitations
#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type")]
pub enum McpServerConfig {
    #[serde(rename = "stdio")]
    Stdio {
        name: String,
        description: Option<String>,
        command: String,
        args: Vec<String>,
        env: Vec<McpEnvVar>,
    },

    // HTTP transport
    #[serde(rename = "http")]
    Http {
        name: String,
        description: Option<String>,
        url: String,
        #[serde(default)]
        headers: Vec<McpHttpHeader>,
    },

    // SSE (Server-Sent Events) transport
    #[serde(rename = "sse")]
    Sse {
        name: String,
        description: Option<String>,
        url: String,
        #[serde(default)]
        headers: Vec<McpHttpHeader>,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct McpEnvVar {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct McpHttpHeader {
    pub name: String,
    pub value: String,
}

// Tool definitions
#[derive(Debug, Clone, Serialize)]
pub struct McpTool {
    pub name: String,
    pub description: Option<String>,
    pub input_schema: Option<serde_json::Value>,
}

// Tool execution
#[derive(Debug, Deserialize)]
pub struct McpToolCallRequest {
    #[serde(rename = "serverId")]
    pub server_id: String,
    #[serde(rename = "toolName")]
    pub tool_name: String,
    pub arguments: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct McpToolCallResponse {
    pub content: Vec<McpContentItem>,
    pub is_error: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum McpContentItem {
    #[serde(rename = "text")]
    Text { text: String },
    #[serde(rename = "resource")]
    Resource { uri: String, mime_type: Option<String> },
    #[serde(rename = "image")]
    Image { data: String, mime_type: String },
}

// Error handling
#[derive(Error, Debug)]
pub enum McpError {
    #[error("Server not found: {0}")]
    ServerNotFound(String),

    #[error("Transport error: {0}")]
    TransportError(String),

    #[error("Protocol error: {0}")]
    ProtocolError(String),

    #[error("Tool execution error: {0}")]
    ToolExecutionError(String),

    #[error("Connection timeout")]
    ConnectionTimeout,

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),

    #[error("Reqwest error: {0}")]
    ReqwestError(#[from] reqwest::Error),
}

pub type McpResult<T> = Result<T, McpError>;

// Log entry for MCP servers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpLogEntry {
    pub timestamp: i64, // Unix timestamp in milliseconds
    pub level: McpLogLevel,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum McpLogLevel {
    Info,
    Error,
    Stdout,
    Stderr,
}
