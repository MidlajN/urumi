import {
    Canvas,
    FabricObject,
    ActiveSelection,
    Rect,
    Group,
    Path
} from "fabric";

import type { RefObject } from "react";
import type { HistoryManager } from "./HistoryManager";
import {
    isObjectInteractionLocked
} from "../../../utils/objectLocking";

type ToolRef = RefObject<string>;

export type ObjectAlignment =
    | "left"
    | "horizontal-center"
    | "right"
    | "top"
    | "vertical-center"
    | "bottom";

type PointObject = {
    x: number;
    y: number;
};

type SelectionEvent = {
    selected?: FabricObject[];
};

type PolygonLike =
    FabricObject & {
        points: PointObject[];
    };

function hasPoints(obj: FabricObject): obj is PolygonLike {
    return (
        "points" in obj &&
        Array.isArray(
            obj.points
        )
    );
}

export class EditorActions {

    private canvas: Canvas;

    private getWorkspace: () => Rect;

    private toolRef: ToolRef;

    private history: HistoryManager;

    private copiedObject: FabricObject | null = null;

    private selectionOrder: FabricObject[] = [];

    constructor(
        canvas: Canvas,
        getWorkspace:() => Rect,
        toolRef: ToolRef,
        history: HistoryManager
    ) {
        this.canvas = canvas;

        this.getWorkspace = getWorkspace;

        this.toolRef = toolRef;

        this.history = history

        this.initSelectionOrder();
    }

    destroy(): void {
        this.canvas.off(
            "selection:created",
            this.handleSelectionChange
        );
        this.canvas.off(
            "selection:updated",
            this.handleSelectionChange
        );
        this.canvas.off(
            "selection:cleared",
            this.handleSelectionCleared
        );
    }

    private initSelectionOrder(): void {
        this.canvas.on(
            "selection:created",
            this.handleSelectionChange
        );
        this.canvas.on(
            "selection:updated",
            this.handleSelectionChange
        );
        this.canvas.on(
            "selection:cleared",
            this.handleSelectionCleared
        );
    }

    private getSelectableObjects(
        objects: FabricObject[]
    ) {
        return objects.filter(
            (
                object
            ) =>
                object.name !== "workspace" &&
                object.name !== "grid" &&
                object.name !== "snap-preview"
        );
    }

    private handleSelectionChange =
        (
            event: SelectionEvent
        ) => {
            const currentSelection =
                this.getSelectableObjects(
                    this.canvas.getActiveObjects()
                );

            if (
                currentSelection.length === 0
            ) {
                this.selectionOrder =
                    [];
                return;
            }

            const retained =
                this.selectionOrder.filter(
                    (
                        object
                    ) =>
                        currentSelection.includes(
                            object
                        )
                );

            const selectedObjects =
                this.getSelectableObjects(
                    event.selected ??
                    []
                ).filter(
                    (
                        object
                    ) =>
                        currentSelection.includes(
                            object
                        ) &&
                        !retained.includes(
                            object
                        )
                );

            const fallbackObjects =
                currentSelection.filter(
                    (
                        object
                    ) =>
                        !retained.includes(
                            object
                        ) &&
                        !selectedObjects.includes(
                            object
                        )
                );

            this.selectionOrder = [
                ...retained,
                ...selectedObjects,
                ...fallbackObjects
            ];
        };

    private handleSelectionCleared =
        () => {
            this.selectionOrder =
                [];
        };

    private getOrderedActiveObjects() {
        const activeObjects =
            this.getSelectableObjects(
                this.canvas.getActiveObjects()
            );

        const retained =
            this.selectionOrder.filter(
                (
                    object
                ) =>
                    activeObjects.includes(
                        object
                    )
            );

        const missing =
            activeObjects.filter(
                (
                    object
                ) =>
                    !retained.includes(
                        object
                    )
            );

        const ordered = [
            ...retained,
            ...missing
        ];

        this.selectionOrder =
            ordered;

        return ordered;
    }

    private alignObjectToBounds(
        object: FabricObject,
        anchorBounds: ReturnType<FabricObject["getBoundingRect"]>,
        alignment: ObjectAlignment
    ) {
        const objectBounds =
            object.getBoundingRect();

        const leftOffset =
            (
                object.left ??
                0
            ) -
            objectBounds.left;

        const topOffset =
            (
                object.top ??
                0
            ) -
            objectBounds.top;

        switch (alignment) {
            case "left":
                object.set({
                    left:
                        anchorBounds.left +
                        leftOffset
                });
                break;
            case "horizontal-center":
                object.set({
                    left:
                        anchorBounds.left +
                        anchorBounds.width / 2 +
                        leftOffset -
                        objectBounds.width / 2
                });
                break;
            case "right":
                object.set({
                    left:
                        anchorBounds.left +
                        anchorBounds.width +
                        leftOffset -
                        objectBounds.width
                });
                break;
            case "top":
                object.set({
                    top:
                        anchorBounds.top +
                        topOffset
                });
                break;
            case "vertical-center":
                object.set({
                    top:
                        anchorBounds.top +
                        anchorBounds.height / 2 +
                        topOffset -
                        objectBounds.height / 2
                });
                break;
            case "bottom":
                object.set({
                    top:
                        anchorBounds.top +
                        anchorBounds.height +
                        topOffset -
                        objectBounds.height
                });
                break;
            default:
                break;
        }

        object.setCoords();
    }

    alignActiveObjects(
        alignment: ObjectAlignment
    ): void {
        const orderedObjects =
            this.getOrderedActiveObjects();

        if (
            orderedObjects.length === 0
        ) {
            return;
        }

        const anchorObject =
            orderedObjects[0];

        const multiObject =
            orderedObjects.length > 1;

        const anchorBounds =
            multiObject
                ? anchorObject.getBoundingRect()
                : this.getWorkspace()
                    .getBoundingRect();

        const targets =
            multiObject
                ? orderedObjects.slice(1)
                : orderedObjects;

        const editableTargets =
            targets.filter(
                (
                    object
                ) =>
                    !isObjectInteractionLocked(
                        object
                    )
            );

        if (
            editableTargets.length === 0
        ) {
            return;
        }

        this.history.beginTransaction();

        editableTargets.forEach(
            (
                object
            ) =>
                this.alignObjectToBounds(
                    object,
                    anchorBounds,
                    alignment
                )
        );

        this.history.endTransaction();

        if (
            orderedObjects.length > 1
        ) {
            this.canvas.discardActiveObject();

            const selection =
                new ActiveSelection(
                    orderedObjects,
                    {
                        canvas:
                            this.canvas
                    }
                );

            this.canvas.setActiveObject(
                selection
            );
        } else {
            this.canvas.setActiveObject(
                orderedObjects[0]
            );
        }

        this.selectionOrder =
            orderedObjects;

        const activeObject =
            this.canvas.getActiveObject();

        if (activeObject) {
            activeObject.setCoords();
        }

        this.canvas.fire(
            "object:modified",
            {
                target:
                    activeObject ??
                    editableTargets[0]
            }
        );

        this.canvas.requestRenderAll();
    }

    moveActiveObject( dx: number, dy: number): void {
        const obj = this.canvas.getActiveObject();

        if (!obj) return;

        obj.set({

            left: (obj.left ?? 0) + dx,

            top: (obj.top ?? 0) + dy

        });

        obj.setCoords();

        this.canvas.fire("object:modified");

        this.canvas.renderAll();
    }

    copy(): void {

        const activeObject = this.canvas.getActiveObject();

        if (!activeObject) return;

        activeObject.clone().then(clonedObj => {
            this.copiedObject = clonedObj;
        });
    }

    paste(): void {
        if (!this.copiedObject) return;

        this.canvas.add(this.copiedObject);

        this.canvas.setActiveObject(
            this.copiedObject
        );

        this.copiedObject.clone().then(clonedObj => {
            this.copiedObject = clonedObj;
        });

        this.canvas.renderAll();
    }

    delete(): void {
        const activeObject = this.canvas.getActiveObject();

        if (!activeObject) return;

        // this.suspendHistory()
        this.history.beginTransaction();

        if (activeObject instanceof ActiveSelection){

            activeObject.forEachObject(obj => {
                this.canvas.remove(obj);
            });

        } else {
            this.canvas.remove(activeObject);
        }

        // this.resumeHistory()
        this.history.endTransaction();

        this.canvas.discardActiveObject();

        this.canvas.fire("object:removed");

        this.canvas.renderAll();
    }

    group(): void {

        const activeObject = this.canvas.getActiveObject();

        if (
            !activeObject || 
            !(activeObject instanceof ActiveSelection)
        ) return;

        const objects = activeObject.getObjects();
        const firstStroke = objects[0].stroke;

        const allSameStroke = objects.every(
            obj => obj.stroke === firstStroke
        );

        // this.suspendHistory();
        this.history.beginTransaction()

        objects.forEach(obj => 
            this.canvas.remove(obj)
        );

        this.canvas.discardActiveObject()

        const group = new Group(objects, { subTargetCheck: true, stroke: allSameStroke ? firstStroke : '' });

        this.canvas.add(group);
        this.canvas.setActiveObject(group);
        
        // this.resumeHistory();
        this.history.endTransaction()

        this.canvas.renderAll();
    }

    split(): void {

        const activeObject = this.canvas.getActiveObject();

        if (
            !activeObject || 
            activeObject instanceof ActiveSelection || 
            activeObject.isFreeDraw
        ) return;

        if (
            activeObject instanceof Group
        ) {
            this.canvas.add(
                ...activeObject.removeAll()
            );
            this.canvas.remove(activeObject);

        } else {

            const type = activeObject.get('type');
            const strokeColor = activeObject.stroke;
            let fabricPaths: Path[] = [];

            const createPath = (path: string) => {
                const fabricPath = new Path(path, {
                    selectable: true,
                    hasControls: true,
                    fill: 'transparent',
                    stroke: strokeColor,
                    strokeWidth: 2
                })
                fabricPaths.push(fabricPath);
            }

            const createLine = (
                x: number,
                y: number, 
                x1: number, 
                y1: number
            ) => {
                const path = new Path(
                    `M ${x} ${y} L ${x1} ${y1}`,
                    {
                        selectable: true,
                        hasControls: true,
                        fill: 'transparent',
                        stroke: strokeColor,
                        strokeWidth: 2
                    }
                )
                fabricPaths.push(path)
            }

            switch (type) {
                case 'path': {
                    if (
                        !(activeObject instanceof Path)
                    ) break;

                    const paths = activeObject.path;
                    fabricPaths = [];

                    const multipleMFound = () => {
                        let firstMFound = false;
                        for (let path of paths) {
                            if (path[0] === 'M' && path.length === 3) {
                                if (firstMFound) return true;
                                else firstMFound = true
                            }
                        }
                        return false;
                    }

                    if (multipleMFound()) {
                        const mainArray = [];
                        let subArray = [];

                        for (let i = 0; i < paths.length; i++) {
                            const pathLine = paths[i] ? paths[i].join(' ') : null;
                            const command = paths[i] ? paths[i][0] : null;

                            if (command === 'M' || i === paths.length) {
                                if (subArray.length) mainArray.push(subArray.join(' '));
                                subArray = [];
                            }
                            subArray.push(pathLine);
                        }
                        for (let i = 0; i < mainArray.length; i++) {
                            if (mainArray[i] !== null) createPath(mainArray[i])
                        }
                    } else {
                        // Single M, Each Path need to have an M command and its command
                        let lastX: number = 0;
                        let lastY: number = 0;
                        let mainMX: number = 0;
                        let mainMY: number = 0;

                        for (let i = 0; i < paths.length; i++) {
                            const command = paths[i][0];
                            let newLine = null;

                            if (command === 'M') {
                                const x = Number(paths[i][1] ?? 0);
                                const y = Number(paths[i][2] ?? 0);

                                lastX = x;
                                lastY = y;

                                mainMX = x;
                                mainMY = y;

                            } else if (command === 'Z') {

                                if (mainMX === lastX && mainMY === lastY) continue;
                                newLine = `M ${lastX} ${lastY} L ${mainMX} ${mainMY}`;
                            } else {

                                newLine = `M ${lastX} ${lastY} ${paths[i].join(' ')}`;
                                const x = Number(paths[i][paths[i].length - 2]) ?? 0;
                                const y = Number(paths[i][paths[i].length - 1]) ?? 0;

                                lastX = x;
                                lastY = y;
                            }

                            if (newLine) createPath(newLine);
                        }

                    }
                    break;
                }
                    
                case 'rect': {
                    fabricPaths = [];
                    const topLeft = { x: activeObject.left, y: activeObject.top };
                    const topRight = { x: activeObject.left + activeObject.width, y: activeObject.top };
                    const bottomLeft = { x: activeObject.left, y: activeObject.top + activeObject.height };
                    const bottomRight = { x: activeObject.left + activeObject.width, y: activeObject.top + activeObject.height }; 

                    createLine(topLeft.x, topLeft.y, topRight.x, topRight.y);
                    createLine(topRight.x, topRight.y, bottomRight.x, bottomRight.y);
                    createLine(bottomRight.x, bottomRight.y,  bottomLeft.x, bottomLeft.y);
                    createLine(bottomLeft.x, bottomLeft.y, topLeft.x, topLeft.y);
                    break;
                }

                case 'polygon': {
                    fabricPaths = [];
                    if (
                        !hasPoints(activeObject)
                    ){
                        break;
                    }

                    const points = activeObject.points;

                    for (let i=0; i < points.length; i++) {
                        const start = points[i];
                        const end = points[(i + 1) % points.length];
                        createLine(start.x, start.y, end.x, end.y)
                    }
                    break;
                }

                case 'triangle': {
                    fabricPaths = [];
                    let left = activeObject.left;
                    let top = activeObject.top;
                    let width = activeObject.width;
                    let height = activeObject.height;

                    let topX = left + width / 2;
                    let topY = top;

                    let bottomLeftX = left;
                    let bottomLeftY = top + height;

                    let bottomRightX = left + width;
                    let bottomRightY = top + height;

                    createLine(topX, topY, bottomLeftX, bottomLeftY);
                    createLine(bottomLeftX, bottomLeftY, bottomRightX, bottomRightY);
                    createLine(bottomRightX, bottomRightY, topX, topY);
                    break;
                }
    
                default:
                    break;
            }

            if (fabricPaths.length === 0) return;

            // this.suspendHistory()
            this.history.beginTransaction()

            const group = new Group(fabricPaths);
            group.set({
                left: activeObject.left,
                top: activeObject.top,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                angle: activeObject.angle,
            });
            group.setCoords();

            const objects = [...group.removeAll()];
            this.canvas.add(...objects);
            this.canvas.remove(activeObject);

            // this.resumeHistory()
            this.history.endTransaction()

        }
        this.canvas.renderAll()
    }


    selectAll(): void {

        if (this.toolRef.current !== "Select") return;

        this.canvas.discardActiveObject();

        const objects = this.canvas.getObjects().filter(obj => {
            const name = obj.get('name');

            return (
                name !== 'workspace' &&
                name !== 'grid' &&
                // Non-selectable objects (off-bed objects in manufacturing
                // mode, the reference layer) never join a select-all.
                obj.selectable !== false
            )
        });

        if (objects.length < 1) return;

        const selection = new ActiveSelection(
            objects,
            { canvas: this.canvas }
        );

        this.canvas.setActiveObject(
            selection
        );

        this.canvas.renderAll();
    }

    highlightObject = (): void => {

        const workspace = this.getWorkspace();

        const selected = this.canvas.getActiveObjects();

        const outsideBox = (obj: FabricObject) => {

            const objBounds = obj.getBoundingRect();

            const wsBounds = workspace.getBoundingRect();

            return (
                objBounds.left < wsBounds.left ||

                objBounds.top < wsBounds.top ||

                objBounds.left + objBounds.width > wsBounds.left + wsBounds.width ||

                objBounds.top + objBounds.height > wsBounds.top + wsBounds.height
            );
        };

        selected.forEach(obj => {obj.borderColor =
            outsideBox(obj) ? "#FF8A8A" : "#43cad4";
        });

        this.canvas.renderAll();
    };

}
