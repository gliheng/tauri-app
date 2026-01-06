use tauri::Manager;

mod handlers;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
                window.close_devtools();
            }

            // Configure window for rounded corners on macOS
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                let window = app.get_webview_window("main").unwrap();

                use objc2::runtime::AnyObject;
                use objc2::msg_send;

                let ns_window: *mut AnyObject = window.ns_window().unwrap() as *mut AnyObject;
                unsafe {
                    // Make window round-cornered
                    let content_view: *mut AnyObject = msg_send![ns_window, contentView];
                    let _: () = msg_send![content_view, setWantsLayer: true];
                    let layer: *mut AnyObject = msg_send![content_view, layer];
                    let _: () = msg_send![layer, setCornerRadius: 10.0_f64];
                    let _: () = msg_send![layer, setMasksToBounds: true];
                }
            }
            Ok(())
        })
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
            handlers::terminal_create_session,
            handlers::terminal_send_input,
            handlers::terminal_resize,
            handlers::terminal_kill_session,
            handlers::acp_terminal_create,
            handlers::acp_terminal_output,
            handlers::acp_terminal_wait_for_exit,
            handlers::acp_terminal_kill,
            handlers::acp_terminal_release,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
