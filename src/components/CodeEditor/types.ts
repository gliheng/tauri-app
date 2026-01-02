export enum FileEntryType {
  File = 'file',
  Folder = 'folder'
}

export interface FileEntry {
  name: string;
  type: FileEntryType;
  content?: string;
  children?: FileEntry[];
}
