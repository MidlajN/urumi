import type { PathGeometry } from "../pathModel";
import type { AnchorPoint } from "./types";


export function extractAnchors(
  geometry: PathGeometry,
  cornerIds: Set<string>,
): AnchorPoint[] {
    const anchors: AnchorPoint[] = [];

    geometry.nodes.forEach((node, index) => {
        if (geometry.closed) {
            if (cornerIds.has(node.id)) {
                anchors.push({
                    nodeId: node.id,

                    index,

                    type: "corner",
                });
            }

            return;
        }

        if (index === 0) {
            anchors.push({
                nodeId: node.id,

                index,

                type: "start",
            });

            return;
        }

        if (index === geometry.nodes.length - 1) {
            anchors.push({
                nodeId: node.id,

                index,

                type: "end",
            });

            return;
        }

        if (cornerIds.has(node.id)) {
            anchors.push({
                nodeId: node.id,

                index,

                type: "corner",
            });
        }
    });

    return anchors;
}
