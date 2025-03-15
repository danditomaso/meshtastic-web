import { // @ts-types="react"
  useCallback, useMemo, useState
} from "react";
import { useDevice } from "@core/stores/deviceStore.ts";
import { numberToHexUnpadded } from "@noble/curves/abstract/utils";

export const useFilteredNodes = () => {
  const { nodes, hardware } = useDevice();
  const [nodeSearch, setNodeSearch] = useState("");

  const filteredNodes = useMemo(() => {
    return Array.from(nodes.values()).filter((node) => {
      if (node.num === hardware.myNodeNum) return false;
      const nodeName = node.user?.longName ?? `!${numberToHexUnpadded(node.num)}`;
      return nodeName.toLowerCase().includes(nodeSearch.toLowerCase());
    });
  }, [nodes, hardware.myNodeNum, nodeSearch]);

  const searchFilteredNodes = useCallback((search: string) => {
    setNodeSearch(search);
  }, []);

  return { filteredNodes, searchFilteredNodes, searchValue: nodeSearch };
};
