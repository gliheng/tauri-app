import { Message } from "ai";
import { ROOT_NODE_ID } from "./constants";

let db: IDBDatabase;

export async function init() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open("ai-studio", 2);
    request.onerror = (event: Event) => {
      console.error(
        "Why didn't you allow my web app to use IndexedDB?!",
        event,
      );
      reject();
    };
    request.onsuccess = (event: Event) => {
      db = (event.target as IDBOpenDBRequest).result;
      db.onerror = (event: Event) => {
        console.error(
          `Database error: ${(event.target as IDBRequest).error?.message}`,
        );
      };
      resolve();
    };
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("chat")) {
        const chatStore = db.createObjectStore("chat", { keyPath: "id" });
        chatStore.createIndex("byUpdateTime", "updatedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("message")) {
        const messageStore = db.createObjectStore("message", {
          autoIncrement: true,
        });
        messageStore.createIndex("byChatId", "chatId", { unique: false });
        messageStore.createIndex("byChatIdAndMessageId", ["chatId", "id"], {
          unique: true,
        });
      }

      if (!db.objectStoreNames.contains("agent")) {
        const agentStore = db.createObjectStore("agent", { keyPath: "id" });
        agentStore.createIndex("byUpdateTime", "updatedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains("library")) {
        const userStore = db.createObjectStore("library", { keyPath: "id" });
        userStore.createIndex("byUpdateTime", "updatedAt", { unique: false });
      }
    };
  });
}

export interface Chat {
  id: string;
  topic: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  chatId: string;
  id: string;
  data: Message;
  parent?: string;
  children?: string[];
  siblingCount?: number;
  siblingIndex?: number;
}

export interface Agent {
  id: string;
  name: string;
  icon: string;
  instructions: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Library {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export function writeChat(data: Chat): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(["chat"], "readwrite");
    const store = transaction.objectStore("chat");
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: Event) => {
      console.error("Error writing chat:", event);
      reject(event);
    };
  });
}

export async function writeMessages(
  chatId: string,
  messages: Message[],
  parent: string | undefined,
) {
  const tr = db.transaction(["message"], "readwrite");
  const store = tr.objectStore("message");
  const writeMessage = (data: Message, parent: string | undefined) => {
    return new Promise((resolve, reject) => {
      const record = {
        chatId,
        id: data.id,
        parent,
        data,
      };

      const add = () => {
        const request = store.add(record);

        request.onsuccess = () => {
          resolve(null);
        };

        request.onerror = (event: Event) => {
          console.error("Error writing message:", event);
          reject(event);
        };
      };

      const msgIndex = store.index("byChatIdAndMessageId");
      msgIndex.get([record.chatId, record.id]).onsuccess = (evt) => {
        const existingRecord = (evt.target as IDBRequest).result;
        if (!existingRecord) {
          add();
        } else {
          resolve(null);
        }
      };
    });
  };

  let prev: Message | undefined;
  for (const msg of messages) {
    await writeMessage(msg, prev?.id ?? parent);
    prev = msg;
  }
}

export function getAllChats(): Promise<Chat[]> {
  return new Promise((resolve, reject) => {
    const tr = db.transaction(["chat"], "readonly");
    const store = tr.objectStore("chat");
    const chatIndex = store.index("byUpdateTime");
    const request = chatIndex.getAll();

    request.onsuccess = () => {
      resolve(request.result.reverse());
    };

    request.onerror = (event: Event) => {
      console.error("Error getting chat list:", event);
      reject(event);
    };
  });
}

export function getChat(chatId: string) {
  return new Promise<{ chat: Chat; messages: ChatMessage[] } | null>(
    (resolve, reject) => {
      const tr = db.transaction(["chat", "message"], "readonly");
      const chatStore = tr.objectStore("chat");
      const messageStore = tr.objectStore("message");

      const chatTask = new Promise<Chat | null>(async (resolve, reject) => {
        const chatRequest = chatStore.get(chatId);
        chatRequest.onsuccess = () => {
          const chat = chatRequest.result;
          if (!chat) {
            resolve(null);
            return;
          }

          resolve(chat as Chat);
        };

        chatRequest.onerror = (event: Event) => {
          console.error("Error getting chat:", event);
          reject(event);
        };
      });

      const messagesTask = new Promise<ChatMessage[]>((resolve, reject) => {
        const messageIndex = messageStore.index("byChatId");
        const messageRequest = messageIndex.getAll(chatId);
        messageRequest.onerror = (event: Event) => {
          console.error("Error getting messages:", event);
          reject(event);
        };
        messageRequest.onsuccess = () => {
          const messages = messageRequest.result as ChatMessage[];
          const latest = selectMessagesFromTree(messages);
          resolve(latest);
        };
      });

      Promise.all([chatTask, messagesTask]).then(
        ([chat, messages]) => {
          if (!chat) {
            resolve(null);
            return;
          }
          resolve({
            chat,
            messages,
          });
        },
        (error) => {
          console.error("Error getting chat and messages:", error);
          reject(new Error("Error getting chat and messages"));
        },
      );
    },
  );
}

export function deleteChat(chatId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // First delete all messages for this chat
    const tr1 = db.transaction(["message"], "readwrite");
    const messageStore = tr1.objectStore("message");

    const messageRange = IDBKeyRange.bound([chatId, 0], [chatId, Infinity]);

    const deleteMessagesRequest = messageStore.delete(messageRange);

    deleteMessagesRequest.onsuccess = () => {
      // Now delete the chat
      const tr2 = db.transaction(["chat"], "readwrite");
      const chatStore = tr2.objectStore("chat");
      const deleteChatRequest = chatStore.delete(chatId);

      deleteChatRequest.onsuccess = () => {
        resolve();
      };

      deleteChatRequest.onerror = (event: Event) => {
        console.error("Error deleting chat:", event);
        reject(event);
      };
    };

    deleteMessagesRequest.onerror = (event: Event) => {
      console.error("Error deleting messages:", event);
      reject(event);
    };
  });
}

export function updateChat(id: string, data: Partial<Chat>): Promise<void> {
  return new Promise((resolve, reject) => {
    const tr = db.transaction(["chat"], "readwrite");
    const store = tr.objectStore("chat");

    // First get the existing chat
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existingChat = getRequest.result;
      if (!existingChat) {
        reject(new Error(`Chat with ID ${id} not found`));
        return;
      }

      // Update the chat with new data
      const updatedChat = { ...existingChat, ...data };
      const putRequest = store.put(updatedChat);

      putRequest.onsuccess = () => {
        resolve();
      };

      putRequest.onerror = (event: Event) => {
        console.error("Error updating chat:", event);
        reject(event);
      };
    };

    getRequest.onerror = (event: Event) => {
      console.error("Error getting chat for update:", event);
      reject(event);
    };
  });
}

export function searchChats(query: string): Promise<Chat[]> {
  return new Promise((resolve, reject) => {
    const tr = db.transaction(["chat"], "readonly");
    const store = tr.objectStore("chat");
    const request = store.getAll();

    request.onsuccess = () => {
      const chats = request.result;
      const filteredChats = chats.filter((chat) =>
        chat.topic.toLowerCase().includes(query.toLowerCase()),
      );
      resolve(filteredChats);
    };

    request.onerror = (event: Event) => {
      console.error("Error searching chats:", event);
      reject(event);
    };
  });
}

export function getMessages(
  chatId: string,
  pathSelection?: Record<string, number>,
) {
  return new Promise<ChatMessage[]>((resolve, reject) => {
    const tr = db.transaction(["message"], "readonly");
    const messageStore = tr.objectStore("message");
    const request = messageStore.index("byChatId").getAll(chatId);

    request.onsuccess = () => {
      const messages = request.result as ChatMessage[];
      resolve(selectMessagesFromTree(messages, pathSelection));
    };

    request.onerror = (event: Event) => {
      console.error("Error getting messages:", event);
      reject(event);
    };
  });
}

/**
 * Write an agent to the database
 * @param agent
 */
export function writeAgent(data: Agent) {
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(["agent"], "readwrite");
    const store = transaction.objectStore("agent");
    const request = store.put(data);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event: Event) => {
      console.error("Error writing agent:", event);
      reject(event);
    };
  });
}

/**
 * Get all agents
 */
export function getAgents() {
  return new Promise<Agent[]>((resolve, reject) => {
    const transaction = db.transaction(["agent"], "readonly");
    const store = transaction.objectStore("agent");
    const request = store.getAll();

    request.onsuccess = () => {
      const agents = request.result as Agent[];
      resolve(agents);
    };

    request.onerror = (event: Event) => {
      console.error("Error getting agents:", event);
      reject(event);
    };
  });
}

/**
 * Get a single agent by ID
 */
export function getAgent(id: string) {
  return new Promise<Agent | undefined>((resolve, reject) => {
    const transaction = db.transaction(["agent"], "readonly");
    const store = transaction.objectStore("agent");
    const request = store.get(id);

    request.onsuccess = () => {
      const agent = request.result as Agent | undefined;
      resolve(agent);
    };

    request.onerror = (event: Event) => {
      console.error("Error getting agent:", event);
      reject(event);
    };
  });
}

// Export/Import functionality
interface ExportData {
  chats: Chat[];
  messages: Message[];
  version: string;
  exportDate: string;
}

/**
 * Export all chats and messages to a JSON object for backup
 */
export async function exportData(): Promise<ExportData> {
  try {
    // Get all chats
    const chats = await getAllChats();

    // Get all messages
    const messages: Message[] = [];
    const tr = db.transaction(["message"], "readonly");
    const store = tr.objectStore("message");

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event: Event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          messages.push(cursor.value);
          cursor.continue();
        } else {
          // No more messages
          const exportData: ExportData = {
            chats,
            messages,
            version: "1.0",
            exportDate: new Date().toISOString(),
          };
          resolve(exportData);
        }
      };

      request.onerror = (event: Event) => {
        console.error("Error exporting messages:", event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    throw error;
  }
}

/**
 * Import chats and messages from a backup
 */
export async function importData(data: ExportData): Promise<void> {
  if (!data.chats || !data.messages || !data.version) {
    throw new Error("Invalid import data format");
  }

  try {
    // Clear existing data
    await clearDatabase();

    // Import chats
    for (const chat of data.chats) {
      await writeChat(chat);
    }

    // Import messages
    const tr = db.transaction(["message"], "readwrite");
    const store = tr.objectStore("message");

    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = data.messages.length;

      if (total === 0) {
        resolve();
        return;
      }

      for (const message of data.messages) {
        const request = store.add(message);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = (event: Event) => {
          console.error("Error importing message:", event);
          reject(event);
        };
      }
    });
  } catch (error) {
    console.error("Error importing data:", error);
    throw error;
  }
}

/**
 * Clear all data from the database
 */
export function clearDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const tr1 = db.transaction(["message"], "readwrite");
    const messageStore = tr1.objectStore("message");
    const clearMessagesRequest = messageStore.clear();

    clearMessagesRequest.onsuccess = () => {
      const tr2 = db.transaction(["chat"], "readwrite");
      const chatStore = tr2.objectStore("chat");
      const clearChatsRequest = chatStore.clear();

      clearChatsRequest.onsuccess = () => {
        resolve();
      };

      clearChatsRequest.onerror = (event: Event) => {
        console.error("Error clearing chats:", event);
        reject(event);
      };
    };

    clearMessagesRequest.onerror = (event: Event) => {
      console.error("Error clearing messages:", event);
      reject(event);
    };
  });
}

function selectMessagesFromTree(
  messages: ChatMessage[],
  pathSelection?: Record<string, number>,
): ChatMessage[] {
  const msgMap: Record<string, ChatMessage> = {};
  const tree: Record<string, string[]> = {};
  for (const msg of messages) {
    msgMap[msg.id] = msg;
    const parent = msg.parent ?? ROOT_NODE_ID;
    if (!tree[parent]) {
      tree[parent] = [];
    }
    tree[parent].push(msg.id);
  }
  for (const msg of messages) {
    const children = tree[msg.id];
    if (children) {
      msg.children = children;
    }
  }

  const list: ChatMessage[] = [];
  let nodeId = ROOT_NODE_ID;
  let children;
  while ((children = tree[nodeId])) {
    const i = pathSelection?.[nodeId] ?? children.length - 1;
    nodeId = children[i];
    const node = msgMap[nodeId];
    node.siblingIndex = i;
    node.siblingCount = children.length;
    list.push(node);
  }

  return list;
}
