import { createContext, useContext } from "react";
import { rootStore } from "../stores/root.store";

const RootStoreContext = createContext(rootStore);
export const RootStoreProvider = RootStoreContext.Provider;

export const useRootStore = () => {
  const store = useContext(RootStoreContext);

  return store;
};
