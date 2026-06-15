import { useEffect, useRef } from "react";

import {
    Line,
    PencilBrush,
    Rect,
    Ellipse,
    Triangle,
    IText,
    Canvas
} from "fabric";

import FontFaceObserver from "fontfaceobserver";
import ReactDOMServer from "react-dom/server";

import { Workspace } from "../canvas/engine/Workspace";

import { useEditorStore } from "../store/editor.store";

import {
    PencilIcon,
    PenIcon,
    RectIcon,
    CircleIcon,
    TriangleIcon,
    TextCursorIcon
} from "../components/Icons";

type Props = {
    canvas: Canvas | null;
    workspace: Workspace | null;
};

export const useEditorSetup = ({
    canvas,
    workspace
}: Props) => {

    const {
        activeTool,
        selectedShape,
        strokeColor,
        fontFamily,
        setTool
    } = useEditorStore();

    const fontRef =
        useRef(fontFamily);

    useEffect(() => {
        fontRef.current =
            fontFamily;
    }, [fontFamily]);

    const componentToUrl = (
        Component: React.FC<any>,
        rotationAngle = 0
    ) => {

        let svgString =
            ReactDOMServer.renderToStaticMarkup(
                <Component
                    size={20}
                    strokeWidth={1.5}
                    color="#4b5563"
                />
            );

        svgString =
            svgString.replace(
                "<svg ",
                `<svg transform="rotate(${rotationAngle})" `
            );

        const blob =
            new Blob(
                [svgString],
                {
                    type:
                        "image/svg+xml"
                }
            );

        return URL.createObjectURL(blob);
    };

    useEffect(() => {

        if (!canvas || !workspace)
            return;

        const resetCanvas = (
            down?: any,
            move?: any,
            up?: any
        ) => {

            canvas.selection =
                true;

            canvas.hoverCursor =
                "all-scroll";

            canvas.defaultCursor =
                "default";

            canvas.isDrawingMode =
                false;

            canvas.getObjects()
                .forEach((obj) => {

                    if (
                        obj.name !==
                        "workspace"
                    ) {
                        obj.set({
                            selectable:
                                true
                        });
                    }
                });

            if (down) {
                canvas.off(
                    "mouse:down",
                    down
                );
            }

            if (move) {
                canvas.off(
                    "mouse:move",
                    move
                );
            }

            if (up) {
                canvas.off(
                    "mouse:up",
                    up
                );
            }

            canvas.renderAll();
        };

        const commonSetup = (
            cursor = "default"
        ) => {

            canvas.discardActiveObject();

            canvas.selection =
                false;

            canvas.hoverCursor =
                cursor;

            canvas.defaultCursor =
                cursor;

            canvas.getObjects()
                .forEach((obj) => {

                    obj.set({
                        selectable:
                            false
                    });
                });
        };

        // -------------------
        // PEN
        // -------------------

        if (
            activeTool ===
            "pen"
        ) {

            canvas.isDrawingMode =
                true;

            canvas.freeDrawingBrush =
                new PencilBrush(
                    canvas
                );

            canvas
                .freeDrawingBrush
                .color =
                strokeColor;

            canvas
                .freeDrawingBrush
                .width = 2;

            const customCursor =
                componentToUrl(
                    PencilIcon,
                    90
                );

            canvas
                .freeDrawingCursor =
                `url(${customCursor}), auto`;

            const onPathCreated =
                (
                    e: any
                ) => {
                    e.path.isFreeDraw =
                        true;
                };

            canvas.on(
                "path:created",
                onPathCreated
            );

            return () => {

                canvas
                    .isDrawingMode =
                    false;

                canvas.off(
                    "path:created",
                    onPathCreated
                );
            };
        }

        // -------------------
        // LINE
        // -------------------

        if (
            activeTool ===
            "line"
        ) {

            const customCursor =
                componentToUrl(
                    PenIcon,
                    90
                );

            commonSetup(
                `url(${customCursor}), auto`
            );

            let line:
                | Line
                | null = null;

            let mouseDown =
                false;

            const mouseDownHandler =
                (
                    event: any
                ) => {

                    const pointer =
                        canvas.getScenePoint(
                            event.e
                        );

                    mouseDown =
                        true;

                    line =
                        new Line(
                            [
                                pointer.x,
                                pointer.y,
                                pointer.x,
                                pointer.y
                            ],
                            {
                                stroke:
                                    strokeColor,

                                strokeWidth:
                                    2,

                                selectable:
                                    false
                            }
                        );

                    canvas.add(
                        line
                    );
                };

            const moveHandler =
                (
                    event: any
                ) => {

                    if (
                        !mouseDown ||
                        !line
                    )
                        return;

                    const pointer =
                        canvas.getScenePoint(
                            event.e
                        );

                    line.set({
                        x2: pointer.x,
                        y2: pointer.y
                    });

                    canvas.requestRenderAll();
                };

            const upHandler =
                () => {

                    if (
                        !line
                    )
                        return;

                    const isDot =
                        Math.abs(
                            line.x1 -
                            line.x2
                        ) < 1 &&
                        Math.abs(
                            line.y1 -
                            line.y2
                        ) < 1;

                    if (
                        isDot
                    ) {
                        canvas.remove(
                            line
                        );
                    } else {
                        line.set({
                            selectable:
                                true
                        });

                        line.setCoords();
                    }

                    mouseDown =
                        false;

                    line =
                        null;
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
                upHandler
            );

            return () =>
                resetCanvas(
                    mouseDownHandler,
                    moveHandler,
                    upHandler
                );
        }

        // -------------------
        // SHAPES
        // -------------------

        if (
            activeTool ===
            "shape"
        ) {

            const icon =
                selectedShape ===
                "rectangle"
                    ? RectIcon
                    : selectedShape ===
                      "circle"
                    ? CircleIcon
                    : TriangleIcon;

            const customCursor =
                componentToUrl(
                    icon,
                    90
                );

            commonSetup(
                `url(${customCursor}), auto`
            );

            let object:
                | any
                | null =
                null;

            let mouseDown =
                false;

            let start:
                | any =
                null;

            const down =
                (
                    event: any
                ) => {

                    mouseDown =
                        true;

                    start =
                        canvas.getScenePoint(
                            event.e
                        );

                    switch (
                        selectedShape
                    ) {
                        case "rectangle":
                            object =
                                new Rect({
                                    left:
                                        start.x,
                                    top:
                                        start.y,
                                    width:
                                        0,
                                    height:
                                        0,
                                    fill:
                                        "transparent",
                                    stroke:
                                        strokeColor,
                                    strokeWidth:
                                        2,
                                    selectable:
                                        false
                                });
                            break;

                        case "circle":
                            object =
                                new Ellipse({
                                    left:
                                        start.x,
                                    top:
                                        start.y,
                                    rx: 0,
                                    ry: 0,
                                    fill:
                                        "transparent",
                                    stroke:
                                        strokeColor,
                                    strokeWidth:
                                        2,
                                    selectable:
                                        false
                                });
                            break;

                        case "triangle":
                            object =
                                new Triangle({
                                    left:
                                        start.x,
                                    top:
                                        start.y,
                                    width:
                                        0,
                                    height:
                                        0,
                                    fill:
                                        "transparent",
                                    stroke:
                                        strokeColor,
                                    strokeWidth:
                                        2,
                                    selectable:
                                        false
                                });
                    }

                    canvas.add(
                        object
                    );
                };

            const move =
                (
                    event: any
                ) => {

                    if (
                        !mouseDown ||
                        !object
                    )
                        return;

                    const pointer =
                        canvas.getScenePoint(
                            event.e
                        );

                    const width =
                        Math.abs(
                            pointer.x -
                            start.x
                        );

                    const height =
                        Math.abs(
                            pointer.y -
                            start.y
                        );

                    if (
                        object.type ===
                            "rect" ||
                        object.type ===
                            "triangle"
                    ) {
                        object.set({
                            width,
                            height
                        });
                    }

                    if (
                        object.type ===
                        "ellipse"
                    ) {
                        object.set({
                            rx:
                                width /
                                2,
                            ry:
                                height /
                                2
                        });
                    }

                    canvas.requestRenderAll();
                };

            const up =
                () => {

                    if (
                        object
                    ) {
                        object.set({
                            selectable:
                                true
                        });

                        object.setCoords();
                    }

                    mouseDown =
                        false;

                    object =
                        null;
                };

            canvas.on(
                "mouse:down",
                down
            );

            canvas.on(
                "mouse:move",
                move
            );

            canvas.on(
                "mouse:up",
                up
            );

            return () =>
                resetCanvas(
                    down,
                    move,
                    up
                );
        }

        // -------------------
        // TEXT
        // -------------------

        if (
            activeTool ===
            "text"
        ) {

            const cursor =
                componentToUrl(
                    TextCursorIcon
                );

            commonSetup(
                `url(${cursor}), auto`
            );

            let allow =
                true;

            const addText =
                async (
                    event: any
                ) => {

                    if (
                        !allow
                    )
                        return;

                    const pointer =
                        canvas.getScenePoint(
                            event.e
                        );

                    const font =
                        new FontFaceObserver(
                            fontRef.current
                        );

                    await font.load(
                        null,
                        15000
                    );

                    const text =
                        new IText(
                            "",
                            {
                                left:
                                    pointer.x,
                                top:
                                    pointer.y,
                                stroke:
                                    strokeColor,
                                strokeWidth:
                                    0.5,
                                fill:
                                    "transparent",
                                fontFamily:
                                    fontRef.current,
                                fontSize:
                                    40
                            }
                        );

                    text.cursorColor =
                        "black";

                    canvas.add(
                        text
                    );

                    canvas.setActiveObject(
                        text
                    );

                    text.enterEditing();

                    text.selectAll();

                    allow =
                        false;
                };

            const exitHandler =
                (
                    e: any
                ) => {

                    const text =
                        e.target;

                    if (
                        text &&
                        !text.text.trim()
                    ) {
                        canvas.remove(
                            text
                        );
                    }

                    setTimeout(
                        () => {
                            allow =
                                true;
                        },
                        200
                    );
                };

            canvas.on(
                "mouse:down",
                addText
            );

            canvas.on(
                "text:editing:exited",
                exitHandler
            );

            return () => {

                canvas.off(
                    "mouse:down",
                    addText
                );

                canvas.off(
                    "text:editing:exited",
                    exitHandler
                );

                resetCanvas();
            };
        }

        if (
            activeTool ===
            "select"
        ) {
            resetCanvas();
        }

    }, [
        canvas,
        workspace,
        activeTool,
        selectedShape,
        strokeColor,
        fontFamily,
        setTool
    ]);

    useEffect(() => {

        const esc =
            (
                e:
                KeyboardEvent
            ) => {

                if (
                    e.key ===
                    "Escape"
                ) {
                    setTool(
                        "select"
                    );
                }
            };

        window.addEventListener(
            "keydown",
            esc
        );

        return () =>
            window.removeEventListener(
                "keydown",
                esc
            );

    }, [setTool]);
};