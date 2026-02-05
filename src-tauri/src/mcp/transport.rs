use crate::mcp::types::{McpServerConfig, McpResult, McpError, McpHttpHeader};
use rmcp::transport::child_process::TokioChildProcess;
use rmcp::transport::streamable_http_client::{StreamableHttpClientTransport, StreamableHttpClientTransportConfig};

/// Enum to hold different transport types
pub enum McpTransport {
    Stdio(TokioChildProcess),
    Http(StreamableHttpClientTransport<reqwest::Client>),
}

/// Creates appropriate transport for each server type
pub async fn create_transport(config: &McpServerConfig) -> McpResult<McpTransport> {
    match config {
        McpServerConfig::Stdio { command, args, env, .. } => {
            create_stdio_transport(command, args, env).await
                .map(McpTransport::Stdio)
        }
        McpServerConfig::Http { url, headers, .. } => {
            create_http_transport(url, headers).await
                .map(McpTransport::Http)
        }
        McpServerConfig::Sse { .. } => {
            Err(McpError::InvalidConfig("SSE transport is not supported in rmcp 0.14".to_string()))
        }
    }
}

/// Create stdio transport (spawn child process)
async fn create_stdio_transport(
    command: &str,
    args: &[String],
    env: &[crate::mcp::types::McpEnvVar],
) -> McpResult<TokioChildProcess> {
    let mut cmd = tokio::process::Command::new(command);
    cmd.args(args);

    // Set environment variables
    for var in env {
        cmd.env(&var.name, &var.value);
    }

    // Use TokioChildProcess from rmcp
    let transport = TokioChildProcess::new(cmd)
        .map_err(|e| McpError::TransportError(format!("Failed to spawn process: {}", e)))?;

    Ok(transport)
}

/// Create HTTP transport using streamable HTTP client
async fn create_http_transport(
    url: &str,
    headers: &[McpHttpHeader],
) -> McpResult<StreamableHttpClientTransport<reqwest::Client>> {
    use reqwest::Client;

    // Build reqwest client with custom headers if provided
    let client = if headers.is_empty() {
        Client::new()
    } else {
        let mut header_map = reqwest::header::HeaderMap::new();
        for header in headers {
            let header_name = header.name.parse::<reqwest::header::HeaderName>()
                .map_err(|e| McpError::TransportError(format!("Invalid header name: {}", e)))?;
            let header_value = header.value.parse::<reqwest::header::HeaderValue>()
                .map_err(|e| McpError::TransportError(format!("Invalid header value: {}", e)))?;
            header_map.insert(header_name, header_value);
        }
        Client::builder().default_headers(header_map).build()
            .map_err(|e| McpError::TransportError(format!("Failed to build HTTP client: {}", e)))?
    };

    let config = StreamableHttpClientTransportConfig::with_uri(url);
    let transport = StreamableHttpClientTransport::with_client(client, config);

    Ok(transport)
}
