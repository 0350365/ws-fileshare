import { useEffect, useState } from "react";
import { Button, List, Upload } from "antd";
import { useRootStore } from "./utils/use-root-store";
import { observer } from "mobx-react-lite";
import {
  FileMetadata,
  FileTransferPacket,
  FileUpdate,
  SocketEvents,
} from "./utils/types";
import { Header } from "./components/header";
import { FileList } from "./utils/types";
import { DownloadItem } from "./components/downloadItem";

const App = observer(() => {
  const root = useRootStore();

  const [fileList, setFileList] = useState<FileList[]>([]);
  const [numActiveConnections, setNumActiveConnections] = useState<number>(
    Number(root.socketStatus)
  );

  useEffect(() => {
    root.on(SocketEvents.FILE_LIST_UPDATE, (update) => {
      console.log(update);
      setFileList(
        Object.keys(update).map((key) => ({
          name: update[key].name,
          uploadedBy: update[key].uploadedBy,
          id: key,
        }))
      );
    });

    root.on(SocketEvents.USER_CONNECTION_UPDATE, (connections) => {
      setNumActiveConnections(connections.length);
    });

    root.on(SocketEvents.FILE_REQUEST_DOWNLOAD, ({ fileId, requestId }) => {
      console.log(`${requestId} has requested download of ${fileId}`);

      const fileMetadata: FileMetadata = {
        filename: root.files[fileId].name,
        totalBufferSize: root.files[fileId].size,
        bufferSize: 1e5,
        type: root.files[fileId].type,
        fileId: fileId,
        recipientId: requestId,
        senderId: root.socketId,
      };

      root.emit(SocketEvents.FILE_SHARE_METADATA, fileMetadata);
    });

    root.on(SocketEvents.FILE_SHARE_METADATA, (metadata: FileMetadata) => {
      console.log("Received file metadata", metadata);
      root.addNewFileTransfer({
        buffer: new Uint8Array(metadata.totalBufferSize),
        metadata: metadata,
        progress: 0,
      });

      root.emit(SocketEvents.FILE_SHARE_BUFFER, {
        fileId: metadata.fileId,
        recipientId: metadata.recipientId,
        senderId: metadata.senderId,
        seq: 0,
        bufferSize: metadata.bufferSize,
      });
    });

    root.on(
      SocketEvents.FILE_SHARE_BUFFER,
      async (buffer: FileTransferPacket) => {
        if (buffer.fileId in root.files) {
          const file = root.files[buffer.fileId];
          const seq = buffer.seq;
          const size = buffer.bufferSize;

          buffer.buffer = await file
            .slice(seq, seq + size + 1)
            .arrayBuffer()
            .then((buf) => new Uint8Array(buf));
          console.log(
            "Sending buffer to receiver with sequence number",
            buffer.seq
          );
          root.emit(SocketEvents.FILE_SHARE_BUFFER, {
            ...buffer,
            seq: seq + size,
            senderId: buffer.recipientId,
            recipientId: buffer.senderId,
            bufferSize: buffer.buffer?.length,
          });

          return;
        }
        console.log("Incoming buffer", buffer.buffer);
        const fileTransfer = root._incomingFileTransfers.get(buffer.fileId);
        if (!fileTransfer) return;

        root.updateFileTransferProgress(
          buffer.fileId,
          new Uint8Array(buffer.buffer)
        );

        if (fileTransfer.progress >= fileTransfer.metadata.totalBufferSize) {
          const file = new File(
            [fileTransfer.buffer],
            fileTransfer.metadata.filename,
            {
              type: fileTransfer.metadata.type,
            }
          );
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileTransfer.metadata.filename;
          a.click();
          URL.revokeObjectURL(url);
          root.removeFileTransfer(buffer.fileId);
        }
        root.emit(SocketEvents.FILE_SHARE_BUFFER, {
          senderId: buffer.recipientId,
          recipientId: buffer.senderId,
          bufferSize: fileTransfer.metadata.bufferSize,
          seq: buffer.seq + 1,
          fileId: buffer.fileId,
        });
      }
    );
  }, []);

  const handleFileUpload = async (file: File) => {
    const fileID = root.addFile(file);

    const action: FileUpdate = {
      action: "add",
      name: file.name,
      id: fileID,
      uploadedBy: root.socketId,
    };

    root.emit(SocketEvents.FILE_LIST_UPDATE, action);
  };

  return (
    <div className="App">
      <Header />
      <div id="container" className="">
        <div id="listWrapper">
          <Upload
            showUploadList={false}
            multiple
            customRequest={(options) => {
              handleFileUpload(options.file as File);
            }}
          >
            <Button
              style={{ backgroundColor: "#8ecae696", borderColor: "#b8ced8" }}
            >
              Upload files
            </Button>
          </Upload>
          <List
            dataSource={fileList}
            bordered
            className="bg-white"
            renderItem={(item) => <DownloadItem item={item} />}
          />
          <p>Number of active connections: {numActiveConnections}</p>
        </div>
      </div>
    </div>
  );
});

export default App;
