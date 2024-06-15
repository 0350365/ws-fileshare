import { observer } from "mobx-react-lite";
import { useRootStore } from "../utils/use-root-store";
import { Button } from "antd";
import { SocketEvents } from "../utils/types";

export const DownloadButton = observer(({ id }: { id: string }) => {
  const root = useRootStore();
  const fileTransfer = root.ongoingFileTransfers;
  console.log(fileTransfer);
  return (
    <Button
      type="primary"
      onClick={() =>
        root.emit(SocketEvents.FILE_REQUEST_DOWNLOAD, {
          fileId: id,
          requestId: root.socketId,
        })
      }
    >
      {fileTransfer.has(id)
        ? fileTransfer.get(id)?.progress! /
          fileTransfer.get(id)?.metadata.totalBufferSize!
        : "Download"}
    </Button>
  );
});
