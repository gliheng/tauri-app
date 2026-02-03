use crate::mcp::types::{McpServerConfig, McpResult, McpError, McpHttpHeader};
use rmcp::transport::TokioChildProcess;
use rmcp::transport::streamable_http_client::StreamableHttpClientTransport;
use rmcp::transport::SseClientTransport;

/// Enum to hold different transport types
pub enum McpTransport {
    Stdio(TokioChildProcess),
    Http(StreamableHttpClientTransport<reqwest::Client>),
    Sse(SseClientTransport<reqwest::Client>),
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
        McpServerConfig::Sse { url, headers, .. } => {
            create_sse_transport(url, headers).await
                .map(McpTransport::Sse)
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

/// Create HTTP transport
async fn create_http_transport(
    url: &str,
    headers: &[McpHttpHeader],
) -> McpResult<StreamableHttpClientTransport<reqwest::Client>> {
    // Create transport from URI - this returns a WorkerTransport directly
    let transport = StreamableHttpClientTransport::from_uri(url);
    
    // Note: Custom headers would need to be configured via reqwest client
    // For now, we use the default client. If headers are needed, we'd need to:
    // 1. Build a custom reqwest::Client with headers
    // 2. Use StreamableHttpClientTransport::with_client if available
    let _ = headers; // Will be used when custom header support is added
    
    Ok(transport)
}

/// Create SSE (Server-Sent Events) transport
async fn create_sse_transport(
    url: &str,
    headers: &[McpHttpHeader],
) -> McpResult<SseClientTransport<reqwest::Client>> {
    // Create SSE transport from URI
    let transport = SseClientTransport::start(url).await
        .map_err(|e| McpError::TransportError(format!("Failed to create SSE transport: {}", e)))?;

    // Note: Custom headers support would be added here if needed
    let _ = headers; // Will be used when custom header support is added
    
    Ok(transport)
}
