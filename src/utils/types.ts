export interface FileMetadata {
  filename: string;
  totalBufferSize: number;
  bufferSize: number;
  type: string;
  fileId: string;
  recipientId: string;
  senderId: string;
}

export interface FileTransferPacket {
  fileId: string;
  seq: number;
  recipientId: string;
  senderId: string;
  bufferSize: number;
  buffer?: Uint8Array;
}

export interface IncomingFileTransfer {
  buffer: Uint8Array;
  metadata: FileMetadata;
  progress: number;
}

export interface FileUpdate {
  action: "add" | "remove";
  name: string;
  id: string;
  uploadedBy: string;
}

export interface FileList {
  name: string;
  id: string;
  uploadedBy: string;
}

export enum SocketEvents {
  FILE_LIST_UPDATE = "update-file",
  FILE_SHARE_START = "fs-start",
  FILE_SHARE_METADATA = "fs-meta",
  FILE_SHARE_BUFFER = "fs-raw",
  FILE_REQUEST_DOWNLOAD = "download-request",
  USER_CONNECTION_UPDATE = "user-connect",
}
