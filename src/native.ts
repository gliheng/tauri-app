import { TrayIcon, TrayIconOptions } from "@tauri-apps/api/tray";
import { defaultWindowIcon } from "@tauri-apps/api/app";
import { getCurrentWindow } from "@tauri-apps/api/window";

export async function setup() {
  const options: TrayIconOptions = {
    icon: (await defaultWindowIcon()) as any,
    action: async (evt) => {
      switch (evt.type) {
        case "Click":
          if (evt.buttonState === "Up") {
            const win = getCurrentWindow();
            if (await win.isMinimized()) {
              await win.unminimize();
            }
            if (await win.isVisible()) {
              await win.show();
            }
            await win.setFocus();
          }
          break;
      }
    },
  };

  const tray = await TrayIcon.new(options);
}
