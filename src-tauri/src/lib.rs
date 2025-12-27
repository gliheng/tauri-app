use tauri::Manager;

mod handlers;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            handlers::acp_initialize,
            handlers::acp_send_message,
            handlers::acp_start_listening,
            handlers::acp_stop_listening,
            handlers::acp_dispose,
            handlers::read_directory,
            handlers::read_file,
            handlers::write_file,
            handlers::create_file,
            handlers::create_directory,
            handlers::rename_file,
            handlers::delete_file,
            handlers::move_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
