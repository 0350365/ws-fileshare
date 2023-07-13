import { useEffect, useState } from "react";
import { Button, List, Upload } from "antd";
import { useRootStore } from "./utils/use-root-store";
import { observer } from "mobx-react-lite";
import { FileTransferMetadata, FileUpdate, SocketEvents } from "./utils/types";
import { Header } from "./components/header";

const App = observer(() => {
  const root = useRootStore();

  const [fileList, setFileList] = useState<
    { name: string; id: string; uploadedBy: string }[]
  >([]);

  const [incomingBuffer, setIncomingBuffer] = useState<{
    metadata?: any;
    buffer?: Uint8Array;
    progress: number;
  }>({ progress: 0 });

  useEffect(() => {
    root.on(SocketEvents.FILE_LIST_UPDATE, (update: FileUpdate) => {
      if (update.action === "add") {
        const { action: _, ...rest } = update;
        setFileList((prev) => {
          return prev.concat(rest);
        });
      }
      if (update.action === "remove") {
        setFileList((prev) => {
          return prev.filter((file) => file.id !== update.id);
        });
      }
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
      console.log("file-transmit incoming buffer", buffer);
      setIncomingBuffer((prev) => {
        prev.buffer?.set(buffer, prev.progress);
        prev.progress += buffer.byteLength;
        return prev;
      });

      if (incomingBuffer.progress !== incomingBuffer.metadata.totalBufferSize) {
        root.emit(SocketEvents.FILE_SHARE_START, {});
      } else {
        console.log("TRANSFER DONE", incomingBuffer);
      }
    });
  }, []);

  const handleFileUpload = async (file: File) => {
    let array = await file.arrayBuffer().then((data) => new Uint8Array(data));
    const metadata: FileTransferMetadata = {
      filename: file.name,
      totalBufferSize: array.length,
      bufferSize: 2048 * 4,
    };
    //console.log(file, metadata, array);
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

  return (
    <div className="App">
      <Header />
      <Upload
        showUploadList={false}
        multiple
        customRequest={(options) => {
          root.addFile(options.file as File);
          handleFileUpload(options.file as File);
        }}
      >
        <Button>Upload files</Button>
      </Upload>
      <List
        dataSource={fileList}
        bordered
        renderItem={(item) => (
          <List.Item
            key={item.id}
            actions={[
              <Button
                type="link"
                danger
                onClick={() => root.removeFile(item.id)}
              >
                Delete
              </Button>,
              <Button
                type="primary"
                onClick={() =>
                  root.sendFileDownloadRequest(item.id, item.uploadedBy)
                }
              >
                Download
              </Button>,
            ]}
          >{`Name: ${item.name}\n Uploaded By: ${item.uploadedBy}`}</List.Item>
        )}
      />
    </div>
  );
});

export default App;
