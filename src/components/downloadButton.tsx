import { observer } from "mobx-react-lite";
import { useRootStore } from "../utils/use-root-store";
import { Button } from "antd";
import { SocketEvents } from "../utils/types";

export const DownloadButton = observer(({ id }: { id: string }) => {
  const root = useRootStore();

  return (
    <Button
      type="primary"
      href={root.blobURLs[id]}
      onClick={() =>
        root.emit(SocketEvents.FILE_REQUEST_DOWNLOAD, {
          fileId: id,
          requestId: root.socketId,
        })
      }
    >
      Download
    </Button>
  );
});
