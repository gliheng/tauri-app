<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Terminal as XTerm } from '@xterm/xterm';
import { nanoid } from 'nanoid';
import { FitAddon } from '@xterm/addon-fit';
import { useResizeObserver } from '@vueuse/core';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';

const props = defineProps({
  cwd: {
    type: String,
    required: true,
  },
});
const terminalRef = ref<HTMLElement>();
let terminal: XTerm | null = null;
let fitAddon: FitAddon | null = null;
let terminalId = nanoid();
let unlisten: (() => void) | null = null;

const sendInput = async (input: string) => {
  try {
    await invoke('terminal_send_input', {
      terminalId,
      input,
    });
  } catch (error) {
    terminal?.writeln(`\r\n\x1b[31mError: ${error}\x1b[0m`);
  }
};

onMounted(async () => {
  if (!terminalRef.value) return;

  terminal = new XTerm({
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#e5e5e5',
    },
  });

  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalRef.value);
  fitAddon.fit();

  // terminal.writeln('\x1b[1;36mWelcome to Raven Terminal\x1b[0m');
  unlisten = await listen(`terminal_output::${terminalId}`, (event: any) => {
    if (!terminal) return;
    
    const { type, data } = event.payload;
    if (type === 'stdout' || type === 'stderr') {
      terminal.write(data);
    } else if (type === 'error') {
      terminal.writeln(`\r\n\x1b[31m${data}\x1b[0m`);
    }
  });

  try {
    await invoke('terminal_create_session', {
      terminalId,
      cwd: props.cwd,
    });
  } catch (error) {
    terminal.writeln(`\x1b[31mFailed to create terminal session: ${error}\x1b[0m`);
  }
  
  terminal.onData((data) => {
    if (!terminal) return;
    sendInput(data);
  });
});

onUnmounted(async () => {
  if (unlisten) {
    unlisten();
  }
  
  try {
    await invoke('terminal_kill_session', {
      terminalId,
    });
  } catch (error) {
    console.error('Failed to kill terminal session:', error);
  }
  
  fitAddon?.dispose();
  terminal?.dispose();
  fitAddon = null;
  terminal = null;
});

useResizeObserver(terminalRef, () => {
  fitAddon?.fit();
});
</script>

<template>
  <div ref="terminalRef" class="terminal-container"></div>
</template>

<style lang="scss" scoped>
.terminal-container {
  width: 100%;
  height: 100%;
  padding: 8px;
  background-color: #1e1e1e;
  overflow: hidden;
}
</style>
