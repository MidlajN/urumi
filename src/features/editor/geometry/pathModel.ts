import {
    Point,
    type FabricObject
} from "fabric";

export type PathNodeType =
    | "corner"
    | "smooth";

export type PathHandle = {
    x: number;
    y: number;
};

export type PathNode = {
    id: string;
    type: PathNodeType;
    x: number;
    y: number;
    handleIn?: PathHandle;
    handleOut?: PathHandle;
};

export type PathGeometry = {
    id: string;
    nodes: PathNode[];
    closed: boolean;
};

type GeometryCarrier = FabricObject & {
    pathGeometry?: PathGeometry;
    isGeometryPath?: boolean;
};

let nodeCounter =
    0;

export function createPathNodeId() {
    nodeCounter +=
        1;

    return `node-${Date.now().toString(36)}-${nodeCounter.toString(36)}`;
}

export function clonePathGeometry(
    geometry: PathGeometry
): PathGeometry {
    return {
        id:
            geometry.id,
        closed:
            geometry.closed,
        nodes:
            geometry.nodes.map(
                (
                    node
                ) => ({
                    ...node,
                    handleIn:
                        node.handleIn
                            ? {
                                ...node.handleIn
                            }
                            : undefined,
                    handleOut:
                        node.handleOut
                            ? {
                                ...node.handleOut
                            }
                            : undefined
                })
            )
    };
}

export function createCornerNode(
    point: Point
): PathNode {
    return {
        id:
            createPathNodeId(),
        type:
            "corner",
        x:
            point.x,
        y:
            point.y
    };
}

export function createSmoothNode(
    point: Point,
    handlePoint: Point
): PathNode {
    const dx =
        handlePoint.x -
        point.x;

    const dy =
        handlePoint.y -
        point.y;

    return {
        id:
            createPathNodeId(),
        type:
            "smooth",
        x:
            point.x,
        y:
            point.y,
        handleIn: {
            x:
                point.x -
                dx,
            y:
                point.y -
                dy
        },
        handleOut: {
            x:
                point.x +
                dx,
            y:
                point.y +
                dy
        }
    };
}

export function getPathGeometry(
    object: FabricObject | null | undefined
) {
    const carrier =
        object as GeometryCarrier | null | undefined;

    return carrier?.isGeometryPath &&
        carrier.pathGeometry
        ? clonePathGeometry(
            carrier.pathGeometry
        )
        : null;
}

export function setPathGeometry(
    object: FabricObject,
    geometry: PathGeometry
) {
    const carrier =
        object as GeometryCarrier;

    carrier.isGeometryPath =
        true;

    carrier.pathGeometry =
        clonePathGeometry(
            geometry
        );

    object.set({
        name:
            object.name ??
            "geometry-path"
    });
}

export function isGeometryPathObject(
    object: FabricObject | null | undefined
) {
    return Boolean(
        getPathGeometry(
            object
        )
    );
}

export function getGeometryNodeId(
    node: PathNode
) {
    return `geom-node:${node.id}`;
}

export function getGeometryHandleInId(
    node: PathNode
) {
    return `geom-handle-in:${node.id}`;
}

export function getGeometryHandleOutId(
    node: PathNode
) {
    return `geom-handle-out:${node.id}`;
}

export function parseGeometryNodeId(
    id: string
) {
    const [
        kind,
        nodeId
    ] = id.split(":");

    if (
        kind === "geom-node" ||
        kind === "geom-handle-in" ||
        kind === "geom-handle-out"
    ) {
        return {
            kind,
            nodeId
        };
    }

    return null;
}

export function pointFromHandle(
    handle: PathHandle
) {
    return new Point(
        handle.x,
        handle.y
    );
}
