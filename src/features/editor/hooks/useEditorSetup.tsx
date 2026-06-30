import { useEffect, useRef, type RefObject } from "react";

import {
    PencilBrush,
    Rect,
    Ellipse,
    Triangle,
    Polygon,
    IText,
    Canvas,
    type FabricObject,
    Point,
} from "fabric";
import { Pentagon as PentagonIcon } from "lucide-react";

import FontFaceObserver from "fontfaceobserver";
import ReactDOMServer from "react-dom/server";

import {
    resolveOperationColor,
    useEditorStore
} from "../store/editor.store";

import {
    PencilIcon,
    PenIcon,
    RectIcon,
    CircleIcon,
    TriangleIcon,
    TextCursorIcon,
} from "../components/Icons";
import {
    ANGLE_CONSTRAINT_INCREMENT_DEG
} from "../geometry/snapConfig";
import {
    PathPreviewRenderer
} from "../geometry/pathPreview";
import {
    SnapFeedback,
    getSnappedPoint
} from "../geometry/snapEngine";
import {
    constrainAngle,
    createRafScheduler,
    distance,
} from "../geometry/geometryUtils";
import type {
    SnapResult,
    SnapTarget
} from "../geometry/types";
import {
    createFabricPathFromGeometry
} from "../geometry/pathBuilder";
import {
    createCornerNode,
    createSmoothNode,
    type PathGeometry,
    type PathNode
} from "../geometry/pathModel";
import { fabricPathToGeometry } from "../geometry/converter/fabricPathToGeometry";
import { normalizePathCommands } from "../geometry/converter/normalizePathCommands";
import { useCanvas } from "../canvas/CanvasProvider";
import { analyzeFreeDrawIntent } from "../geometry/analysis/pipeline";

type Props = {
  canvas: Canvas | null;
  toolRef: RefObject<string>;
};

export const useEditorSetup = ({ canvas, toolRef }: Props) => {
    const {
        activeTool,
        selectedShape,
        strokeColor,
        fontFamily,
        fontSize,
        setTool,
    } = useEditorStore();

    const { workspace } = useCanvas();

    const operationStrokeColor = resolveOperationColor(strokeColor);

    const fontRef = useRef(fontFamily);

    useEffect(() => {
        fontRef.current = fontFamily;
    }, [fontFamily]);

    const componentToUrl = (Component: React.FC<any>, rotationAngle = 0) => {
        let svgString = ReactDOMServer.renderToStaticMarkup(
            <Component size={20} strokeWidth={1.5} color="#4b5563" />,
        );

        svgString = svgString.replace(
            "<svg ",
            `<svg transform="rotate(${rotationAngle})" `,
        );

        const blob = new Blob([svgString], { type: "image/svg+xml" });

        return URL.createObjectURL(blob);
    };

    useEffect(() => {
        if (!canvas) return;

        toolRef.current =
            activeTool === "select"
                ? "Select"
                    : activeTool === "pen"
                    ? "Pen"
                        : activeTool === "line"
                        ? "Lines"
                            : activeTool === "shape"
                            ? "Elements"
                            : "Text";

        const getScenePoint = (event: any) => canvas.getScenePoint(event.e);

        const isEditableText = (obj: FabricObject): obj is IText => obj.type === "i-text";

        const finalizeCreatedObject = (object: FabricObject) => {
            object.set({
                selectable: true,
            });

            object.setCoords();

            canvas.fire("object:modified", {
                target: object,
            });
        };

        const createPolygonPoints = (width: number, height: number) => [
            {
                x: width / 2,
                y: 0,
            },
            {
                x: width,
                y: height * 0.38,
            },
            {
                x: width * 0.82,
                y: height,
            },
            {
                x: width * 0.18,
                y: height,
            },
            {
                x: 0,
                y: height * 0.38,
            },
        ];

        const resetCanvas = (down?: any, move?: any, up?: any) => {
            canvas.selection = true;

            canvas.hoverCursor = "all-scroll";

            canvas.defaultCursor = "auto";

            canvas.isDrawingMode = false;

            canvas.getObjects().forEach((obj) => {
                if (obj.name !== "workspace") {
                    obj.set({
                        selectable: true,
                    });
                }
            });

            if (down) {
                canvas.off("mouse:down", down);
            }

            if (move) {
                canvas.off("mouse:move", move);
            }

            if (up) {
                canvas.off("mouse:up", up);
            }

            canvas.renderAll();
        };

        const commonSetup = (cursor = "default") => {
            canvas.discardActiveObject();

            canvas.selection = false;

            canvas.hoverCursor = cursor;

            canvas.defaultCursor = cursor;

            canvas.getObjects().forEach((obj) => {
                obj.set({
                    selectable: false,
                });
            });
        };

        // -------------------
        // PEN
        // -------------------

        if (activeTool === "pen") {
            canvas.isDrawingMode = true;

            canvas.freeDrawingBrush = new PencilBrush(canvas);

            canvas.freeDrawingBrush.color = operationStrokeColor;

            canvas.freeDrawingBrush.width = 2;

            const customCursor = componentToUrl(PencilIcon, 90);

            canvas.freeDrawingCursor = `url(${customCursor}), auto`;

            const onPathCreated = (e: any) => {
                e.path.isFreeDraw = true;

                const originalPath = e.path;

                const normalized = normalizePathCommands(
                    originalPath.path
                );

                const result = analyzeFreeDrawIntent(
                    fabricPathToGeometry(
                        normalized
                    )
                );

                const { geometry } = result;

                const geometryPath =
                    createFabricPathFromGeometry(
                        geometry,
                        {
                            stroke: operationStrokeColor,
                            strokeWidth: originalPath.strokeWidth,
                            fill: originalPath.fill
                        }
                    );

                workspace?.beginHistoryTransaction();

                canvas.remove(
                    originalPath
                );

                canvas.add(
                    geometryPath
                );

                workspace?.endHistoryTransaction();
            };

            canvas.on("path:created", onPathCreated);

            return () => {
                canvas.isDrawingMode = false;

                canvas.off("path:created", onPathCreated);

                URL.revokeObjectURL(customCursor);
            };
        }

        // -------------------
        // PATH
        // -------------------

        if (activeTool === "line") {
            const customCursor = componentToUrl(PenIcon, 90);

            commonSetup(`url(${customCursor}), auto`);

            const snapFeedback =
                new SnapFeedback(
                    canvas
                );

            const previewRenderer =
                new PathPreviewRenderer(
                    canvas,
                    {
                        stroke: operationStrokeColor
                    }
                );

            let draftGeometry: PathGeometry = {
                id:
                    `path-${Date.now().toString(36)}`,
                nodes:
                    [],
                closed:
                    false
            };

            let previewNode: PathNode | null =
                null;

            let pointerDown:
                | {
                    nodeId: string;
                    startPoint: Point;
                    startClientX: number;
                    startClientY: number;
                    dragging: boolean;
                }
                | null =
                null;

            let disposed =
                false;

            const createDrawingTargets =
                () => {
                    const targets: SnapTarget[] =
                        [];

                    draftGeometry.nodes
                        .slice(
                            0,
                            -1
                        )
                        .forEach(
                            (
                                node
                            ) => {
                                targets.push({
                                    id:
                                        `drawing:endpoint:${node.id}`,
                                    sourceId:
                                        "drawing",
                                    type:
                                        "endpoint",
                                    point:
                                        new Point(
                                            node.x,
                                            node.y
                                        ),
                                    nodeId:
                                        `geom-node:${node.id}`
                                });
                            }
                        );

                    return targets;
                };

            const getShiftKey =
                (
                    event: {
                        e: Event;
                    }
                ) =>
                    "shiftKey" in event.e &&
                    Boolean(
                        event.e.shiftKey
                    );

            const resolvePoint =
                (
                    event: {
                        e: Event;
                        scenePoint?: Point;
                    },
                    anchor?: Point
                ): SnapResult => {
                    const rawPoint =
                        event.scenePoint ??
                        getScenePoint(
                            event
                        );

                    const constrainedPointer =
                        anchor &&
                        getShiftKey(
                            event
                        )
                            ? constrainAngle(
                                rawPoint,
                                anchor,
                                ANGLE_CONSTRAINT_INCREMENT_DEG
                            )
                            : rawPoint;

                    const snapped =
                        getSnappedPoint(
                            constrainedPointer,
                            {
                                canvas,
                                context:
                                    "POLYLINE_DRAW",
                                extraTargets:
                                    createDrawingTargets(),
                                allowedTargetTypes:
                                    [
                                        "endpoint"
                                    ]
                            }
                        );

                    if (
                        anchor &&
                        getShiftKey(
                            event
                        )
                    ) {
                        const constrainedSnapped =
                            constrainAngle(
                                snapped.point,
                                anchor,
                                ANGLE_CONSTRAINT_INCREMENT_DEG
                            );

                        return {
                            ...snapped,
                            snapped:
                                snapped.snapped &&
                                distance(
                                    snapped.point,
                                    constrainedSnapped
                                ) <
                                    0.5,
                            point:
                                constrainedSnapped
                        };
                    }

                    return snapped;
                };

            const syncPreview =
                () => {
                    previewRenderer.setGeometry(
                        draftGeometry,
                        previewNode
                    );
                };

            const clearSession =
                () => {
                    draftGeometry = {
                        id:
                            `path-${Date.now().toString(36)}`,
                        nodes:
                            [],
                        closed:
                            false
                    };
                    previewNode =
                        null;
                    pointerDown =
                        null;
                    moveScheduler.cancel();
                    previewRenderer.clear();
                    snapFeedback.clear();
                };

            const finishPath =
                (
                    changeTool = true
                ) => {
                    if (
                        disposed
                    ) {
                        return;
                    }

                    const finalGeometry =
                        {
                            ...draftGeometry,
                            nodes:
                                draftGeometry.nodes.map(
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

                    clearSession();

                    if (
                        finalGeometry.nodes.length >=
                        2
                    ) {
                        const path =
                            createFabricPathFromGeometry(
                                finalGeometry,
                                {
                                    id:
                                        "added-path",
                                    name:
                                        "geometry-path",
                                    fill:
                                        "transparent",
                                    stroke:
                                        operationStrokeColor,
                                    strokeWidth:
                                        2,
                                    selectable:
                                        true
                                }
                            );

                        canvas.add(
                            path
                        );
                        canvas.setActiveObject(
                            path
                        );
                        finalizeCreatedObject(
                            path
                        );
                    }

                    if (changeTool) {
                        setTool(
                            "select"
                        );
                    }
                };

            const cancelPath =
                (
                    changeTool = true
                ) => {
                    if (
                        disposed
                    ) {
                        return;
                    }

                    clearSession();

                    if (changeTool) {
                        setTool(
                            "select"
                        );
                    }
                };

            const recoverDrawingSession =
                () => {
                    if (
                        draftGeometry.nodes.length >=
                        2
                    ) {
                        finishPath();
                        return;
                    }

                    cancelPath();
                };

            const getEventClientPoint =
                (
                    event: {
                        e: Event;
                    }
                ) => {
                    if (
                        event.e instanceof MouseEvent ||
                        event.e instanceof PointerEvent
                    ) {
                        return {
                            x:
                                event.e.clientX,
                            y:
                                event.e.clientY
                        };
                    }

                    return {
                        x:
                            0,
                        y:
                            0
                    };
                };

            const getLastNode =
                () =>
                    draftGeometry.nodes[
                        draftGeometry.nodes.length -
                            1
                    ];

            const updateNodeAsSmooth =
                (
                    nodeId: string,
                    handlePoint: Point
                ) => {
                    draftGeometry = {
                        ...draftGeometry,
                        nodes:
                            draftGeometry.nodes.map((node) => {
                                if (node.id !== nodeId) { return node; }

                                const smoothNode =
                                    createSmoothNode(
                                        new Point(
                                            node.x,
                                            node.y
                                        ),
                                        handlePoint
                                    );

                                return {
                                    ...smoothNode,
                                    id: node.id
                                };
                            })
                    };
                };

            const handleMoveFrame =
                (
                    event: {
                        e: Event;
                        scenePoint?: Point;
                    }
                ) => {
                    if (
                        disposed
                    ) {
                        return;
                    }

                    const anchor =
                        getLastNode();

                    if (!anchor) {
                        const snapped =
                            resolvePoint(
                                event
                            );

                        snapFeedback.update(
                            snapped
                        );
                        return;
                    }

                    if (pointerDown) {
                        const clientPoint =
                            getEventClientPoint(
                                event
                            );

                        const dragDistance =
                            Math.hypot(
                                clientPoint.x -
                                    pointerDown.startClientX,
                                clientPoint.y -
                                    pointerDown.startClientY
                            );

                        if (
                            dragDistance >
                            3
                        ) {
                            pointerDown.dragging =
                                true;

                            let handlePoint =
                                getScenePoint(
                                    event
                                );

                            if (
                                getShiftKey(
                                    event
                                )
                            ) {
                                handlePoint =
                                    constrainAngle(
                                        handlePoint,
                                        pointerDown.startPoint,
                                        ANGLE_CONSTRAINT_INCREMENT_DEG
                                    );
                            }

                            updateNodeAsSmooth(
                                pointerDown.nodeId,
                                handlePoint
                            );
                            syncPreview();
                            return;
                        }
                    }

                    const snapped =
                        resolvePoint(
                            event,
                            new Point(
                                anchor.x,
                                anchor.y
                            )
                        );

                    previewNode =
                        createCornerNode(
                            snapped.point
                        );

                    syncPreview();
                    snapFeedback.update(
                        snapped
                    );
                };

            const moveScheduler =
                createRafScheduler<{
                    e: Event;
                    scenePoint?: Point;
                }>(
                    handleMoveFrame
                );

            const commitNode =
                (
                    node: PathNode
                ) => {
                    draftGeometry = {
                        ...draftGeometry,
                        nodes: [
                            ...draftGeometry.nodes,
                            node
                        ]
                    };

                    previewNode =
                        null;

                    syncPreview();
                };

            const mouseDownHandler =
                (
                    event: {
                        e: Event;
                        scenePoint?: Point;
                    }
                ) => {
                    moveScheduler.cancel();

                    const anchor =
                        getLastNode();

                    const snapped =
                        resolvePoint(
                            event,
                            anchor
                                ? new Point(
                                    anchor.x,
                                    anchor.y
                                )
                                : undefined
                        );

                    const nextPoint =
                        snapped.point;

                    const previousPoint =
                        anchor;

                    const firstNode =
                        draftGeometry.nodes[0];

                    if (
                        firstNode &&
                        draftGeometry.nodes.length >=
                            2 &&
                        snapped.targetId ===
                            `drawing:endpoint:${firstNode.id}`
                    ) {
                        draftGeometry = {
                            ...draftGeometry,
                            closed:
                                true
                        };
                        finishPath();
                        return;
                    }

                    if (
                        previousPoint &&
                        distance(
                            new Point(
                                previousPoint.x,
                                previousPoint.y
                            ),
                            nextPoint
                        ) <
                            0.5
                    ) {
                        return;
                    }

                    const node =
                        createCornerNode(
                            nextPoint
                        );

                    commitNode(
                        node
                    );

                    const clientPoint =
                        getEventClientPoint(
                            event
                        );

                    pointerDown = {
                        nodeId:
                            node.id,
                        startPoint:
                            new Point(
                                node.x,
                                node.y
                            ),
                        startClientX:
                            clientPoint.x,
                        startClientY:
                            clientPoint.y,
                        dragging:
                            false
                    };

                    snapFeedback.update(
                        snapped
                    );
                };

            const moveHandler =
                (
                    event: {
                        e: Event;
                        scenePoint?: Point;
                    }
                ) => {
                    moveScheduler.schedule(
                        event
                    );
                };

            const windowPointerMoveHandler =
                (
                    event: PointerEvent
                ) => {
                    if (
                        draftGeometry.nodes.length ===
                        0
                    ) {
                        return;
                    }

                    moveScheduler.schedule({
                        e:
                            event
                    });
                };

            const doubleClickHandler =
                () => {
                    finishPath();
                };

            const mouseUpHandler =
                () => {
                    pointerDown =
                        null;
                };

            const keyHandler =
                (
                    event: KeyboardEvent
                ) => {
                    if (
                        event.key !== "Enter" &&
                        event.key !== "Escape"
                    ) {
                        return;
                    }

                    if (
                        draftGeometry.nodes.length >=
                        2
                    ) {
                        event.preventDefault();
                        finishPath();
                        return;
                    }

                    cancelPath();
                };

            const blurHandler =
                () => {
                    recoverDrawingSession();
                };

            const visibilityHandler =
                () => {
                    if (
                        document.visibilityState ===
                        "hidden"
                    ) {
                        recoverDrawingSession();
                    }
                };

            canvas.on(
                "mouse:down",
                mouseDownHandler
            );
            canvas.on(
                "mouse:move",
                moveHandler
            );
            canvas.on(
                "mouse:up",
                mouseUpHandler
            );
            canvas.on(
                "mouse:dblclick",
                doubleClickHandler
            );
            window.addEventListener(
                "keydown",
                keyHandler
            );
            window.addEventListener(
                "pointermove",
                windowPointerMoveHandler
            );
            window.addEventListener(
                "blur",
                blurHandler
            );
            document.addEventListener(
                "visibilitychange",
                visibilityHandler
            );

            return () => {
                disposed =
                    true;
                moveScheduler.cancel();
                previewRenderer.destroy();
                snapFeedback.destroy();
                resetCanvas(
                    mouseDownHandler,
                    moveHandler,
                    mouseUpHandler
                );
                canvas.off(
                    "mouse:dblclick",
                    doubleClickHandler
                );
                window.removeEventListener(
                    "keydown",
                    keyHandler
                );
                window.removeEventListener(
                    "pointermove",
                    windowPointerMoveHandler
                );
                window.removeEventListener(
                    "blur",
                    blurHandler
                );
                document.removeEventListener(
                    "visibilitychange",
                    visibilityHandler
                );
                URL.revokeObjectURL(customCursor);
            };
        }

        // -------------------
        // SHAPES
        // -------------------

        if (activeTool === "shape") {
            const icon =
                selectedShape === "rectangle"
                    ? RectIcon
                    : selectedShape === "circle"
                        ? CircleIcon
                        : selectedShape === "polygon"
                            ? PentagonIcon
                            : TriangleIcon;

            const customCursor = componentToUrl(icon, 90);

            commonSetup(`url(${customCursor}), auto`);

            let object: any | null = null;

            let mouseDown = false;

            let start: any = null;

            const down = (event: any) => {
                if (mouseDown) return;

                mouseDown = true;

                start = getScenePoint(event);

                switch (selectedShape) {
                    case "rectangle":
                        object = new Rect({
                            left: start.x,
                            top: start.y,
                            width: 0,
                            height: 0,
                            fill: "transparent",
                            stroke: operationStrokeColor,
                            strokeWidth: 2,
                            selectable: false,
                        });
                        break;

                    case "circle":
                        object = new Ellipse({
                            left: start.x,
                            top: start.y,
                            rx: 0,
                            ry: 0,
                            fill: "transparent",
                            stroke: operationStrokeColor,
                            strokeWidth: 2,
                            selectable: false,
                        });
                        break;

                    case "triangle":
                        object = new Triangle({
                            left: start.x,
                            top: start.y,
                            width: 0,
                            height: 0,
                            fill: "transparent",
                            stroke: operationStrokeColor,
                            strokeWidth: 2,
                            selectable: false,
                        });
                        break;

                    case "polygon":
                        object = new Polygon(createPolygonPoints(0, 0), {
                            left: start.x,
                            top: start.y,
                            fill: "transparent",
                            stroke: operationStrokeColor,
                            strokeWidth: 2,
                            selectable: false,
                        });
                }

                canvas.add(object);
            };

            const move = (event: any) => {
                if (!mouseDown || !object) return;

                const pointer = getScenePoint(event);

                const width = Math.abs(pointer.x - start.x);

                const height = Math.abs(pointer.y - start.y);

                if (object.type === "rect" || object.type === "triangle") {
                    object.set({
                        width,
                        height,
                    });

                    if (pointer.x < start.x) {
                        object.set({
                            left: pointer.x,
                        });
                    }

                    if (pointer.y < start.y) {
                        object.set({
                            top: pointer.y,
                        });
                    }
                }

                if (object.type === "ellipse") {
                    object.set({
                        rx: width / 2,
                        ry: height / 2,
                    });

                if (pointer.x < start.x) {
                    object.set({
                        left: pointer.x,
                    });
                }

                if (pointer.y < start.y) {
                    object.set({
                        top: pointer.y,
                    });
                }
                }

                if (object instanceof Polygon) {
                    object.set({
                        points: createPolygonPoints(width, height),
                    });

                    object.setDimensions();

                    object.set({
                        left: pointer.x < start.x ? pointer.x : start.x,
                        top: pointer.y < start.y ? pointer.y : start.y,
                    });
                }

                canvas.requestRenderAll();
            };

            const up = () => {
                if (!object) {

                    mouseDown = false;
                    return;
                }

                let isDot = false;

                if (object.type === "rect" || object.type === "triangle") {
                    isDot = object.width < 1 || object.height < 1;
                }

                if (object.type === "ellipse") {
                    isDot = object.rx < 0.5 || object.ry < 0.5;
                }

                if (object instanceof Polygon) {
                    isDot = object.width < 1 || object.height < 1;
                }

                if (isDot) {
                    canvas.remove(object);
                } else {
                    finalizeCreatedObject(object);
                }

                mouseDown = false;

                object = null;
            };

            canvas.on("mouse:down", down);

            canvas.on("mouse:move", move);

            canvas.on("mouse:up", up);

            return () => {
                resetCanvas(down, move, up);
                URL.revokeObjectURL(customCursor);
            };
        }

        // -------------------
        // TEXT
        // -------------------

        if (activeTool === "text") {
            const cursor = componentToUrl(TextCursorIcon);

            commonSetup(`url(${cursor}), auto`);

            let allow = true;

            let disposed = false;

            const addText = async (event: any) => {
                if (!allow) return;

                const pointer = getScenePoint(event);

                const scenePoint = new Point(pointer.x, pointer.y);

                const isIntersectingText = 
                    canvas
                        .getObjects()
                        .some((obj) => isEditableText(obj) && obj.containsPoint(scenePoint));

                if (isIntersectingText) return;

                allow = false;

                const font = new FontFaceObserver(fontRef.current);

                try {
                    await font.load(null, 15000);
                } catch {
                    // Continue with the requested family; the browser may still have a fallback.
                }

                if (disposed) return;

                const text = new IText("", {
                    left: pointer.x,
                    top: pointer.y,
                    stroke: operationStrokeColor,
                    strokeWidth: 0.5,
                    fill: "transparent",
                    fontFamily: fontRef.current,
                    fontSize: fontSize,
                });

                text.cursorColor = "black";

                canvas.add(text);

                text.initDimensions();

                canvas.setActiveObject(text);

                canvas.renderAll();

                text.enterEditing();

                text.selectAll();
            };

            const exitHandler = (e: any) => {
                const text = e.target;

                if (text && !text.text.trim()) {
                    canvas.remove(text);
                }

                setTimeout(() => {
                    allow = true;
                }, 200);
            };

            canvas.on("mouse:down", addText);

            canvas.on("text:editing:exited", exitHandler);

            return () => {
                disposed = true;

                canvas.off("mouse:down", addText);

                canvas.off("text:editing:exited", exitHandler);

                const active = canvas.getActiveObject();

                if (active && isEditableText(active) && active.isEditing) {
                    const text = active.text?.trim();

                    if (!text) {
                        canvas.remove(active);
                    }

                    canvas.discardActiveObject();
                }

                resetCanvas();

                URL.revokeObjectURL(cursor);
            };
        }

        if (activeTool === "select") {
            resetCanvas();
        }

    }, [
        canvas,
        activeTool,
        selectedShape,
        operationStrokeColor,
        fontFamily,
        fontSize,
        setTool,
        toolRef,
    ]);

    useEffect(() => {
        const esc = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setTool("select");
            }
        };

        window.addEventListener("keydown", esc);

        return () => window.removeEventListener("keydown", esc);
        
    }, [setTool]);
};
