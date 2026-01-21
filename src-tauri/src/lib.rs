use tauri_plugin_sql::{Migration, MigrationKind};

mod handlers;

fn get_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        },
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:data.db", get_migrations())
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            #[cfg(debug_assertions)] // only include this code on debug builds
            {
                use tauri::Manager;
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
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
            handlers::watch_file,
            handlers::unwatch_file,
            handlers::stop_watching,
            handlers::get_opencode_models,
            handlers::glob_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
