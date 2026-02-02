import { observer } from "mobx-react-lite";
import { useRootStore } from "../utils/use-root-store";
import styled from "styled-components";

const HeaderWrapper = styled.div``;

export const Header = observer(() => {
  const root = useRootStore();

  return (
    <HeaderWrapper>
      <h1>Upload your files</h1>
      {`Socket is ${
        root.socketStatus ? `connected, ID: ${root.socketId}` : "disconnected"
      }`}
    </HeaderWrapper>
  );
});
