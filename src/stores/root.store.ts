import { io, Socket } from "socket.io-client";
import { makeAutoObservable } from "mobx";
import { nanoid } from "nanoid";
import { FileUpdate, SocketEvents } from "../utils/types";

class RootStore {
  private _socket: Socket;
  private _connected: boolean = false;
  private _id: string = "";

  private _clientUploadedFiles: Record<string, File> = {};
  private _fileDownloadURLs: Record<string, string> = {};

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

  get blobURLs() {
    return this._fileDownloadURLs;
  }
}
export const rootStore: RootStore = new RootStore();
