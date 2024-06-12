import { makeAutoObservable } from "mobx";
import { FileList, FileUpdate } from "../utils/types";

export class ServerState {
  _fileList: FileList[] = [];
  constructor() {
    makeAutoObservable(this);
  }

  get fileList() {
    return this._fileList;
  }

  updateFileList(action: FileUpdate) {
    if (action.action === "add") {
      const { action: _, ...rest } = action;
      this._fileList.concat({ ...rest, blobURL: "" });
    } else if (action.action === "remove") {
      this._fileList.filter((file) => file.id !== action.id);
    }
  }
}
