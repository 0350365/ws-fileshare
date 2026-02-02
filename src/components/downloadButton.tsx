import { observer } from "mobx-react-lite";
import { useRootStore } from "../utils/use-root-store";
import { Button } from "antd";
import { SocketEvents } from "../utils/types";

export const DownloadButton = observer(({ id }: { id: string }) => {
  const root = useRootStore();
  const fileTransfer = root.ongoingFileTransfers;

  return (
    <Button
      type="primary"
      onClick={() =>
        !(id in root.files)
          ? root.emit(SocketEvents.FILE_REQUEST_DOWNLOAD, {
              fileId: id,
              requestId: root.socketId,
            })
          : ""
      }
    >
      {fileTransfer.has(id)
        ? `${Math.round(
            (fileTransfer.get(id)?.progress! /
              fileTransfer.get(id)?.metadata.totalBufferSize!) *
              100,
          )} %`
        : "Download"}
    </Button>
  );
});
