import {
    Line,
    Path,
    Point,
    Polyline,
    type FabricObject
} from "fabric";
import {
    applyGeometryToFabricPath
} from "../geometry/pathBuilder";
import {
    getPathGeometry,
    parseGeometryNodeId
} from "../geometry/pathModel";

export function isNodeEditableObject(
    object: FabricObject | null | undefined
): object is FabricObject {
    return Boolean(
        object &&
        (
            object instanceof Line ||
            object instanceof Path ||
            object instanceof Polyline
        )
    );
}

function objectLocalToScene(
    object: FabricObject,
    point: Point
) {
    return point.transform(
        object.calcTransformMatrix()
    );
}

function getPathPointIndex(
    command: unknown[]
) {
    return command.length - 2;
}

function parseNodeId(
    nodeId: string
) {
    const geometryNode =
        parseGeometryNodeId(
            nodeId
        );

    if (geometryNode) {
        return geometryNode;
    }

    const [
        kind,
        first,
        second
    ] = nodeId.split(":");

    if (kind === "poly") {
        return {
            kind,
            pointIndex:
                Number(first)
        };
    }

    if (kind === "path") {
        return {
            kind,
            commandIndex:
                Number(first),
            pointIndex:
                Number(second)
        };
    }

    if (
        nodeId === "line:start" ||
        nodeId === "line:end"
    ) {
        return {
            kind: "line"
        };
    }

    return null;
}

function deleteGeometryPathNode(
    object: Path,
    nodeId: string
) {
    const geometry =
        getPathGeometry(
            object
        );

    const parsed =
        parseGeometryNodeId(
            nodeId
        );

    if (
        !geometry ||
        !parsed ||
        parsed.kind !== "geom-node" ||
        geometry.nodes.length <= 2
    ) {
        return false;
    }

    const deletedIndex =
        geometry.nodes.findIndex(
            (
                node
            ) =>
                node.id ===
                parsed.nodeId
        );

    if (
        deletedIndex < 0
    ) {
        return false;
    }

    const anchorBeforeNode =
        geometry.nodes[
            deletedIndex > 0
                ? deletedIndex - 1
                : 1
        ];

    const anchorBefore =
        objectLocalToScene(
            object,
            new Point(
                anchorBeforeNode.x -
                    object.pathOffset.x,
                anchorBeforeNode.y -
                    object.pathOffset.y
            )
        );

    geometry.nodes.splice(
        deletedIndex,
        1
    );

    applyGeometryToFabricPath(
        object,
        geometry
    );

    const anchorAfterNode =
        geometry.nodes.find(
            (
                node
            ) =>
                node.id ===
                anchorBeforeNode.id
        );

    if (anchorAfterNode) {
        const anchorAfter =
            objectLocalToScene(
                object,
                new Point(
                    anchorAfterNode.x -
                        object.pathOffset.x,
                    anchorAfterNode.y -
                        object.pathOffset.y
                )
            );

        const diff =
            anchorAfter.subtract(
                anchorBefore
            );

        object.set({
            left:
                (
                    object.left ??
                    0
                ) - diff.x,
            top:
                (
                    object.top ??
                    0
                ) - diff.y,
            dirty:
                true
        });
        object.setCoords();
    }

    return true;
}

function deletePolylineNode(
    object: Polyline,
    pointIndex: number
) {
    if (
        pointIndex < 0 ||
        pointIndex >= object.points.length ||
        object.points.length <= 2
    ) {
        return false;
    }

    const anchorIndexBefore =
        pointIndex > 0
            ? pointIndex - 1
            : 1;

    const anchorBeforePoint =
        object.points[
            anchorIndexBefore
        ];

    const anchorBefore =
        objectLocalToScene(
            object,
            new Point(
                anchorBeforePoint.x -
                    object.pathOffset.x,
                anchorBeforePoint.y -
                    object.pathOffset.y
            )
        );

    object.points.splice(
        pointIndex,
        1
    );

    object.setDimensions();

    const anchorIndexAfter =
        anchorIndexBefore > pointIndex
            ? anchorIndexBefore - 1
            : anchorIndexBefore;

    const anchorAfterPoint =
        object.points[
            anchorIndexAfter
        ];

    const anchorAfter =
        objectLocalToScene(
            object,
            new Point(
                anchorAfterPoint.x -
                    object.pathOffset.x,
                anchorAfterPoint.y -
                    object.pathOffset.y
            )
        );

    const diff =
        anchorAfter.subtract(
            anchorBefore
        );

    object.set({
        left:
            (
                object.left ??
                0
            ) - diff.x,
        top:
            (
                object.top ??
                0
            ) - diff.y,
        dirty: true
    });

    object.setCoords();

    return true;
}

function countDrawablePathCommands(
    object: Path
) {
    return object.path.filter(
        (command) =>
            command[0] !== "Z" &&
            command.length >= 3
    ).length;
}

function findPathAnchorCommandIndex(
    object: Path,
    commandIndex: number
) {
    let index =
        commandIndex > 0
            ? commandIndex - 1
            : object.path.length - 1;

    for (
        let checked = 0;
        checked < object.path.length;
        checked += 1
    ) {
        const command =
            object.path[index];

        if (
            command &&
            index !== commandIndex &&
            command[0] !== "Z" &&
            command.length >= 3
        ) {
            return index;
        }

        index =
            index > 0
                ? index - 1
                : object.path.length - 1;
    }

    return -1;
}

function getPathCommandScenePoint(
    object: Path,
    commandIndex: number
) {
    const command =
        object.path[
            commandIndex
        ];

    if (
        !command ||
        command[0] === "Z" ||
        command.length < 3
    ) {
        return null;
    }

    const pointIndex =
        getPathPointIndex(
            command
        );

    const x =
        Number(
            command[
                pointIndex
            ]
        );

    const y =
        Number(
            command[
                pointIndex + 1
            ]
        );

    if (
        !Number.isFinite(x) ||
        !Number.isFinite(y)
    ) {
        return null;
    }

    return objectLocalToScene(
        object,
        new Point(
            x - object.pathOffset.x,
            y - object.pathOffset.y
        )
    );
}

function deletePathNode(
    object: Path,
    commandIndex: number
) {
    const command =
        object.path[
            commandIndex
        ];

    if (
        !command ||
        command[0] === "M" ||
        command[0] === "Z" ||
        countDrawablePathCommands(
            object
        ) <= 2
    ) {
        return false;
    }

    const anchorCommandIndex =
        findPathAnchorCommandIndex(
            object,
            commandIndex
        );

    const anchorBefore =
        getPathCommandScenePoint(
            object,
            anchorCommandIndex
        );

    if (!anchorBefore) {
        return false;
    }

    object.path.splice(
        commandIndex,
        1
    );

    object.setDimensions();

    const anchorIndexAfter =
        anchorCommandIndex > commandIndex
            ? anchorCommandIndex - 1
            : anchorCommandIndex;

    const anchorAfter =
        getPathCommandScenePoint(
            object,
            anchorIndexAfter
        );

    if (!anchorAfter) {
        return false;
    }

    const diff =
        anchorAfter.subtract(
            anchorBefore
        );

    object.set({
        left:
            (
                object.left ??
                0
            ) - diff.x,
        top:
            (
                object.top ??
                0
            ) - diff.y,
        dirty: true
    });

    object.setCoords();

    return true;
}

export function deleteNodeFromObject(
    object: FabricObject | null | undefined,
    nodeId: string | null | undefined
) {
    if (
        !object ||
        !nodeId
    ) {
        return false;
    }

    const parsed =
        parseNodeId(
            nodeId
        );

    if (!parsed) {
        return false;
    }

    if (
        parsed.kind === "line" &&
        object instanceof Line
    ) {
        return false;
    }

    if (
        parsed.kind === "poly" &&
        object instanceof Polyline
    ) {
        const pointIndex =
            Number(
                "pointIndex" in parsed
                    ? parsed.pointIndex
                    : NaN
            );

        if (
            !Number.isFinite(
                pointIndex
            )
        ) {
            return false;
        }

        return deletePolylineNode(
            object,
            pointIndex
        );
    }

    if (
        parsed.kind === "path" &&
        object instanceof Path
    ) {
        const commandIndex =
            Number(
                "commandIndex" in parsed
                    ? parsed.commandIndex
                    : NaN
            );

        if (
            !Number.isFinite(
                commandIndex
            )
        ) {
            return false;
        }

        return deletePathNode(
            object,
            commandIndex
        );
    }

    if (
        parsed.kind === "geom-node" &&
        object instanceof Path
    ) {
        return deleteGeometryPathNode(
            object,
            nodeId
        );
    }

    return false;
}
