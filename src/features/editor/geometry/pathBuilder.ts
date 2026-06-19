import {
    Path,
    type FabricObjectProps,
    type SerializedPathProps,
    type TOptions
} from "fabric";

import {
    clonePathGeometry,
    setPathGeometry,
    type PathGeometry,
    type PathNode
} from "./pathModel";

type PathCommand =
    | [
        "M",
        number,
        number
    ]
    | [
        "L",
        number,
        number
    ]
    | [
        "C",
        number,
        number,
        number,
        number,
        number,
        number
    ]
    | [
        "Z"
    ];

function getCubicCommand(
    start: PathNode,
    end: PathNode
): PathCommand {
    if (
        start.handleOut ||
        end.handleIn
    ) {
        const handleOut =
            start.handleOut ?? {
                x:
                    start.x,
                y:
                    start.y
            };

        const handleIn =
            end.handleIn ?? {
                x:
                    end.x,
                y:
                    end.y
            };

        return [
            "C",
            handleOut.x,
            handleOut.y,
            handleIn.x,
            handleIn.y,
            end.x,
            end.y
        ];
    }

    return [
        "L",
        end.x,
        end.y
    ];
}

export function buildFabricPathData(
    geometry: PathGeometry
): PathCommand[] {
    const [
        first,
        ...rest
    ] = geometry.nodes;

    if (!first) {
        return [];
    }

    const commands: PathCommand[] = [
        [
            "M",
            first.x,
            first.y
        ]
    ];

    let previous =
        first;

    rest.forEach(
        (
            node
        ) => {
            commands.push(
                getCubicCommand(
                    previous,
                    node
                )
            );

            previous =
                node;
        }
    );

    if (
        geometry.closed &&
        geometry.nodes.length > 1
    ) {
        commands.push(
            getCubicCommand(
                previous,
                first
            )
        );
        commands.push([
            "Z"
        ]);
    }

    return commands;
}

export function createFabricPathFromGeometry(
    geometry: PathGeometry,
    options: Partial<
        TOptions<
            FabricObjectProps &
                SerializedPathProps
        >
    > = {}
) {
    const path =
        new Path(
            buildFabricPathData(
                geometry
            ) as never,
            {
                fill:
                    "transparent",
                stroke:
                    "#111827",
                strokeWidth:
                    2,
                selectable:
                    true,
                ...options
            }
        );

    setPathGeometry(
        path,
        geometry
    );

    return path;
}

export function applyGeometryToFabricPath(
    path: Path,
    geometry: PathGeometry
) {
    const nextGeometry =
        clonePathGeometry(
            geometry
        );

    path.path =
        buildFabricPathData(
            nextGeometry
        ) as never;

    path.setDimensions();
    path.set({
        dirty:
            true
    });
    path.setCoords();

    setPathGeometry(
        path,
        nextGeometry
    );
}
