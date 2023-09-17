import { useEffect, useState } from "react";
import { Button, List, Upload } from "antd";
import { useRootStore } from "./utils/use-root-store";
import { observer } from "mobx-react-lite";
import { FileTransferMetadata, FileUpdate, SocketEvents } from "./utils/types";
import { Header } from "./components/header";
import { nanoid } from "nanoid";
import { FileList } from "./utils/types";
import { DownloadItem } from "./components/downloadItem";

const App = observer(() => {
  const root = useRootStore();

  const [fileList, setFileList] = useState<FileList[]>([]);

  const [incomingBuffer, setIncomingBuffer] = useState<{
    metadata?: any;
    buffer: Uint8Array;
    progress: number;
  }>({ progress: 0, buffer: new Uint8Array() });

  useEffect(() => {
    root.on(SocketEvents.FILE_LIST_UPDATE, (update: FileUpdate[]) => {
      update.forEach((u) => {
        if (u.action === "add") {
          const { action: _, ...rest } = u;
          setFileList((prev) => {
            return prev.concat({ ...rest, blobURL: "" });
          });
        }
        if (u.action === "remove") {
          setFileList((prev) => {
            return prev.filter((file) => file.id !== u.id);
          });
        }
      });
    });

    root.on(
      SocketEvents.FILE_SHARE_METADATA,
      (metadata: FileTransferMetadata) => {
        setIncomingBuffer((prev) => {
          prev.metadata = metadata;
          prev.progress = 0;
          prev.buffer = new Uint8Array(metadata.totalBufferSize);
          return prev;
        });
        root.emit(SocketEvents.FILE_SHARE_START, {});
      }
    );

    root.on(SocketEvents.FILE_SHARE_BUFFER, (buffer: Uint8Array) => {
      setIncomingBuffer((prev) => {
        prev.buffer.set(new Uint8Array(buffer), prev.progress);
        prev.progress += buffer.byteLength;
        return prev;
      });

      if (incomingBuffer.progress !== incomingBuffer.metadata.totalBufferSize) {
        root.emit(SocketEvents.FILE_SHARE_START, {});
        console.log("File share start event");
      } else {
        console.log("TRANSFER DONE", incomingBuffer);
        root.addFile(
          new File([incomingBuffer.buffer], incomingBuffer.metadata.filename, {
            type: incomingBuffer.metadata.type,
          }),
          incomingBuffer.metadata.id
        );
      }
    });
  }, []);

  const handleFileUpload = async (file: File) => {
    let array = await file.arrayBuffer().then((data) => new Uint8Array(data));

    const fileID = nanoid();

    const action: FileUpdate = {
      action: "add",
      name: file.name,
      id: fileID,
      uploadedBy: root._id,
    };

    root.emit(SocketEvents.FILE_LIST_UPDATE, action);

    const metadata: FileTransferMetadata = {
      filename: file.name,
      totalBufferSize: array.length,
      bufferSize: 2048 * 4,
      type: file.type,
      id: fileID,
    };

    root.emit(SocketEvents.FILE_SHARE_METADATA, { metadata: metadata });
    root.on(SocketEvents.FILE_SHARE_START, () => {
      const chunk = array.slice(0, metadata.bufferSize);
      array = array.slice(metadata.bufferSize, metadata.totalBufferSize);
      if (chunk.length !== 0) {
        root.emit(SocketEvents.FILE_SHARE_BUFFER, {
          buffer: chunk,
        });
      }
    });
  };

  console.log(fileList);

  return (
    <div className="App">
      <Header />
      <div id="container">
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
            style={{ backgroundColor: "white" }}
            renderItem={(item) => <DownloadItem item={item} />}
          />
        </div>
      </div>
    </div>
  );
});

export default App;
