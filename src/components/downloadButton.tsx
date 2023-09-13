import { observer } from "mobx-react-lite";
import { useRootStore } from "../utils/use-root-store";
import { Button } from "antd";

export const DownloadButton = observer(({ id }: { id: string }) => {
  const root = useRootStore();

  return (
    <Button
      type="primary"
      href={root.blobURLs[id]}
      download={root.files[id] ? root.files[id].name : ""}
      onClick={() => console.log(root.blobURLs[id])}
    >
      Download
    </Button>
  );
});
