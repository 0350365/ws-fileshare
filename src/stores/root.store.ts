import { io, Socket } from "socket.io-client";
import { makeAutoObservable, observable } from "mobx";
import { nanoid } from "nanoid";
import { FileUpdate, IncomingFileTransfer, SocketEvents } from "../utils/types";

class RootStore {
  private _socket: Socket;
  private _connected: boolean = false;
  private _id: string = "";

  private _clientUploadedFiles: Record<string, File> = {};
  _incomingFileTransfers: Map<string, IncomingFileTransfer> = observable.map();

  constructor() {
    makeAutoObservable(this);
    this._socket = io(`${window.location.hostname}:3030`);
    this._socket.on("connect", () => {
      console.log(`Socket connected`);
      this.setConnectionStatus(true);
      this.setId(this._socket.id);
    });

    this._socket.on("disconnect", () => {
      console.log("Socket disconnected");
      this.setConnectionStatus(false);
    });
  }

  private setConnectionStatus(status: boolean) {
    this._connected = status;
  }

  private setId(id: string) {
    this._id = id;
  }

  emit(event: SocketEvents, message: any) {
    this._socket.emit(event, message);
  }

  on(event: SocketEvents, callback: (...args: any[]) => void) {
    this._socket.off(event).on(event, callback);
  }

  addFile(file: File, fileid?: string): string {
    const id = fileid || nanoid();
    if (!this.files[id]) {
      this._clientUploadedFiles[id] = file;
    }
    return id;
  }

  removeFile(id: string) {
    delete this._clientUploadedFiles[id];

    const action: Omit<FileUpdate, "name" | "uploadedBy"> = {
      action: "remove",
      id: id,
    };

    this.emit(SocketEvents.FILE_LIST_UPDATE, action);
  }

  get files() {
    return this._clientUploadedFiles;
  }

  get socketStatus() {
    return this._connected;
  }

  get socketId() {
    return this._id;
  }

  get ongoingFileTransfers() {
    return this._incomingFileTransfers;
  }

  addNewFileTransfer(fileTransfer: IncomingFileTransfer) {
    this._incomingFileTransfers.set(fileTransfer.metadata.fileId, fileTransfer);
  }

  removeFileTransfer(fileId: string) {
    this._incomingFileTransfers.delete(fileId);
  }

  updateFileTransferProgress(fileId: string, newBuffer: Uint8Array) {
    const fileTransfer = this._incomingFileTransfers.get(fileId);
    if (!fileTransfer) return;
    fileTransfer.buffer.set(new Uint8Array(newBuffer), fileTransfer.progress);
    fileTransfer.progress += newBuffer.length;
    console.log(`FIle transfer progress`, fileTransfer.progress);
  }
}
export const rootStore: RootStore = new RootStore();
