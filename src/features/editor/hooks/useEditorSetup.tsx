import { useEffect, useRef, type RefObject } from "react";

import {
    Line,
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

import { useEditorStore } from "../store/editor.store";

import {
    PencilIcon,
    PenIcon,
    RectIcon,
    CircleIcon,
    TriangleIcon,
    TextCursorIcon,
} from "../components/Icons";

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

            canvas.freeDrawingBrush.color = strokeColor;

            canvas.freeDrawingBrush.width = 2;

            const customCursor = componentToUrl(PencilIcon, 90);

            canvas.freeDrawingCursor = `url(${customCursor}), auto`;

            const onPathCreated = (e: any) => {
                e.path.isFreeDraw = true;
            };

            canvas.on("path:created", onPathCreated);

            return () => {
                canvas.isDrawingMode = false;

                canvas.off("path:created", onPathCreated);

                URL.revokeObjectURL(customCursor);
            };
        }

        // -------------------
        // LINE
        // -------------------

        if (activeTool === "line") {
            const customCursor = componentToUrl(PenIcon, 90);

            commonSetup(`url(${customCursor}), auto`);

            let line: Line | null = null;

            let mouseDown = false;

            const mouseDownHandler = (event: any) => {
                if (mouseDown) return;

                const pointer = getScenePoint(event);

                mouseDown = true;

                line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                    id: "added-line",

                    stroke: strokeColor,

                    strokeWidth: 2,

                    selectable: false,
                });

                canvas.add(line);
            };

            const moveHandler = (event: any) => {
                if (!mouseDown || !line) return;

                const pointer = getScenePoint(event);

                const nextPoint = {
                    x: pointer.x,
                    y: pointer.y,
                };

                if (event.e.ctrlKey) {
                    const deltaX = Math.abs(pointer.x - line.x1);

                    const deltaY = Math.abs(pointer.y - line.y1);

                    if (deltaY > deltaX) {
                        nextPoint.x = line.x1;
                    } else {
                        nextPoint.y = line.y1;
                    }
                }

                line.set({
                    x2: nextPoint.x,
                    y2: nextPoint.y,
                });

                canvas.requestRenderAll();
            };

            const upHandler = () => {
                if (!line) return;

                const isDot = Math.abs(line.x1 - line.x2) < 1 && Math.abs(line.y1 - line.y2) < 1;

                if (isDot) {
                    canvas.remove(line);
                } else {
                    finalizeCreatedObject(line);
                }

                mouseDown = false;

                line = null;
            };

            canvas.on("mouse:down", mouseDownHandler);

            canvas.on("mouse:move", moveHandler);

            canvas.on("mouse:up", upHandler);

            return () => {
                resetCanvas(mouseDownHandler, moveHandler, upHandler);
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
                            stroke: strokeColor,
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
                            stroke: strokeColor,
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
                            stroke: strokeColor,
                            strokeWidth: 2,
                            selectable: false,
                        });
                        break;

                    case "polygon":
                        object = new Polygon(createPolygonPoints(0, 0), {
                            left: start.x,
                            top: start.y,
                            fill: "transparent",
                            stroke: strokeColor,
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
                    stroke: strokeColor,
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
        strokeColor,
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
