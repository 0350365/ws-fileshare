import { io, Socket } from "socket.io-client";
import { makeAutoObservable } from "mobx";
import { nanoid } from "nanoid";
import { FileUpdate, SocketEvents } from "../utils/types";

class RootStore {
  _socket: Socket;
  _connected: boolean = false;
  _id: string = "";

  _clientUploadedFiles: Record<string, File> = {};

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

  addFile(file: File): string {
    const id = nanoid();
    console.log("Adding a new file");
    this._clientUploadedFiles[id] = file;

    const action: FileUpdate = {
      action: "add",
      name: file.name,
      id: id,
      uploadedBy: this._id,
    };

    this.emit(SocketEvents.FILE_LIST_UPDATE, action);
    const url = URL.createObjectURL(file);
    return url;
  }

  removeFile(id: string) {
    delete this._clientUploadedFiles[id];

    const action: Omit<FileUpdate, "name" | "uploadedBy"> = {
      action: "remove",
      id: id,
    };

    this.emit(SocketEvents.FILE_LIST_UPDATE, action);
  }

  sendFileDownloadRequest(fileId: string, clientId: string) {
    //this.emit(SocketEvents.FILE_SHARE_DOWNLOAD, {})
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
}
export const rootStore: RootStore = new RootStore();
