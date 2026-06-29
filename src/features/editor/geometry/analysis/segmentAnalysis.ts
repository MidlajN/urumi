import { Point } from "fabric";

import type { PathGeometry } from "../pathModel";

import { distanceToLine } from "./geometryMath";

import type { GeometrySegment } from "./types";

import { extractAnchors } from "./anchorExtraction";

const DEFAULT_LINE_DEVIATION = 0.03;

type Deviation = {
  maxDeviation: number;
  averageDeviation: number;
  deviationRatio: number;
};

function calculateSegmentDeviation(
  geometry: PathGeometry,
  nodeIndices: number[],
): Deviation {
  if (nodeIndices.length < 2) {
    return {
      maxDeviation: 0,
      averageDeviation: 0,
      deviationRatio: 0,
    };
  }

  const nodes = geometry.nodes;

  const start = nodes[nodeIndices[0]];

  const end = nodes[nodeIndices[nodeIndices.length - 1]];

  const startPoint = new Point(start.x, start.y);

  const endPoint = new Point(end.x, end.y);

  let maxDeviation = 0;
  let totalDeviation = 0;

  for (let i = 1; i < nodeIndices.length - 1; i++) {
    const node = nodes[nodeIndices[i]];

    const deviation = distanceToLine(
      new Point(node.x, node.y),
      startPoint,
      endPoint,
    );

    totalDeviation += deviation;

    maxDeviation = Math.max(maxDeviation, deviation);
  }

  const averageDeviation = totalDeviation / Math.max(nodeIndices.length - 2, 1);

  const segmentLength = Math.hypot(end.x - start.x, end.y - start.y);

  const deviationRatio = averageDeviation / Math.max(segmentLength, 1);

  return {
    maxDeviation,
    averageDeviation,
    deviationRatio,
  };
}


export function analyzeSegments(
  geometry: PathGeometry,
  cornerIds: Set<string>,
  lineTolerance = DEFAULT_LINE_DEVIATION,
): GeometrySegment[] {

    const anchors = extractAnchors(
        geometry,
        cornerIds
    )

    const anchorIndices = anchors.map(anchor => anchor.index);

    if (!geometry.closed && anchorIndices.length < 2) {
        return [];
    }

    const segments: GeometrySegment[] = [];

    if (!geometry.closed) {
        for (let i = 0; i < anchorIndices.length - 1; i++) {

            const startIndex = anchorIndices[i];

            const endIndex = anchorIndices[i + 1];

            const nodeIndices = [];

            for (let j = startIndex; j <= endIndex; j++) {
                nodeIndices.push(j);
            }

            const deviation = calculateSegmentDeviation(geometry, nodeIndices);

            segments.push({
                startAnchorId: geometry.nodes[startIndex].id,

                endAnchorId: geometry.nodes[endIndex].id,

                startIndex,
                endIndex,

                nodeIndices,

                maxDeviation: deviation.maxDeviation,

                averageDeviation: deviation.averageDeviation,

                deviationRatio: deviation.deviationRatio,

                type: deviation.deviationRatio < lineTolerance ? "line" : "curve",
            });
        }

    } else {

        for (let i = 0; i < anchorIndices.length; i++) {
            const startIndex = anchorIndices[i];

            const endIndex = anchorIndices[(i + 1) % anchorIndices.length];

            const nodeIndices = [];

            let cursor = startIndex;

            while (true) {
                nodeIndices.push(cursor);

                if (cursor === endIndex) {
                    break;
                }

                cursor = (cursor + 1) % geometry.nodes.length;
            }

            const deviation = calculateSegmentDeviation(geometry, nodeIndices);


            segments.push({
                startAnchorId: geometry.nodes[startIndex].id,

                endAnchorId: geometry.nodes[endIndex].id,

                startIndex,
                endIndex,

                nodeIndices,

                maxDeviation: deviation.maxDeviation,

                averageDeviation: deviation.averageDeviation,

                deviationRatio: deviation.deviationRatio,

                type: deviation.deviationRatio < lineTolerance ? "line" : "curve",
            });
        }
    }

    return segments;
}
