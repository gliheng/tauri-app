import { JSONValue } from "ai";

let db: IDBDatabase;

function init() {
  const request = indexedDB.open("ai-studio");
  request.onerror = (event) => {
    console.error("Why didn't you allow my web app to use IndexedDB?!");
  };
  request.onsuccess = (event) => {
    db = event.target.result;
  };

  db.onerror = (event) => {
    console.error(`Database error: ${event.target.error?.message}`);
  };

  request.onupgradeneeded = (event) => {
    // Save the IDBDatabase interface
    const db = event.target.result;

    // Create an objectStore for this database
    const chatStore = db.createObjectStore("chat", { keyPath: "id" });
    chatStore.createIndex("topic", "topic", { unique: false });

    const messageStore = db.createObjectStore("message", { keyPath: "" });
  };
}

export function getChatList() {
  const tr = db.transaction(["chat"], "readonly");

}

export function getChat() {
  const tr = db.transaction(["chat", "message"], "readonly");

}

export function writeMessage(chatId: string, msgId: string, data: JSONValue) {
  const tr = db.transaction(["message"], "readwrite");
  const store = tr.objectStore("message");
  store.add({
    chatId,
    msgId,
    data,
  });
}