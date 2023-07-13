export interface FileTransferMetadata {
  filename: string;
  totalBufferSize: number;
  bufferSize: number;
}

export interface FileUpdate {
  action: "add" | "remove";
  name: string;
  id: string;
  uploadedBy: string;
}

export enum SocketEvents {
  FILE_LIST_UPDATE = "update-file",
  FILE_SHARE_START = "fs-start",
  FILE_SHARE_METADATA = "fs-meta",
  FILE_SHARE_BUFFER = "fs-raw",
}
