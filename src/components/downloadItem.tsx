import { DownloadButton } from "./downloadButton";
import { List, Button } from "antd";
import { useRootStore } from "../utils/use-root-store";
import { FileList } from "../utils/types";
import { observer } from "mobx-react-lite";
import styled from "styled-components";

const DownloadItemWrapper = styled(List.Item)`
  background-color: #0076b615;
  transition: background-color 0.3s ease;
  border-radius: 3px;

  &:hover {
    background-color: #c8b6ff42;
  }
`;

export const DownloadItem = observer(({ item }: { item: FileList }) => {
  const root = useRootStore();
  return (
    <DownloadItemWrapper
      key={item.id}
      actions={[
        <Button type="link" danger onClick={() => root.removeFile(item.id)}>
          Delete
        </Button>,
        <DownloadButton id={item.id} />,
      ]}
    >{`Name: ${item.name}\n Uploaded By: ${item.uploadedBy}`}</DownloadItemWrapper>
  );
});
