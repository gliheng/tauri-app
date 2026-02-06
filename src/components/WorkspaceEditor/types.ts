export enum FileEntryType {
  File = 'file',
  Folder = 'folder'
}

export interface FileEntry {
  name: string;
  type: FileEntryType;
  path: string;
  content?: string;
  children?: FileEntry[];
}
