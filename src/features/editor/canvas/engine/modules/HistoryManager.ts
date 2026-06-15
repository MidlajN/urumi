import {
    Canvas,
    Rect
} from "fabric";

type UpdateWorkspace = (workspace: Rect) => void;

export class HistoryManager {

    private canvas: Canvas;

    private updateWorkspace: UpdateWorkspace;

    private undoStack: string[] = [];

    private redoStack: string[] = [];

    private isUndoRedo = false;

    private transactionDepth = 0;

    constructor(
        canvas: Canvas,
        updateWorkspace: UpdateWorkspace
    ) {
        this.canvas = canvas;

        this.updateWorkspace = updateWorkspace;
    }

    init(): void {
        this.canvas.on(
            "object:added",
            this.saveState
        );

        this.canvas.on(
            "object:modified",
            this.saveState
        );

        this.canvas.on(
            "object:removed",
            this.saveState
        );
    }

    destroy(): void {
        this.canvas.off(
            "object:added",
            this.saveState
        );

        this.canvas.off(
            "object:modified",
            this.saveState
        );

        this.canvas.off(
            "object:removed",
            this.saveState
        );
    }

    beginTransaction():
        void {

        this.transactionDepth++;
    }

    endTransaction(): void {

        this.transactionDepth--;

        if (
            this.transactionDepth
            <= 0
        ) {
            this.transactionDepth = 0;

            this.saveState();
        }
    }

    undo(): void {
        if (
            this.undoStack.length <= 1
        ) return;

        this.isUndoRedo = true;

        const currentState = this.undoStack.pop();

        if (
            currentState !== undefined
        ) {
            this.redoStack.push(currentState);
        }

        const prevState = this.undoStack[
            this.undoStack.length - 1
        ];

        this.canvas
            .loadFromJSON(prevState)
            .then(() => {
                this.canvas.getObjects().forEach(
                    obj => {

                        if (
                            obj instanceof Rect &&
                            obj.name === "workspace"
                        ) {

                            obj.set({
                                selectable: false,
                                hasControls: false
                            });

                            obj.setCoords();

                            this.updateWorkspace(obj);
                        }
                    }
                );

                this.isUndoRedo = false;

                this.canvas.renderAll();
            }
        );
    }

    redo(): void {

        if (this.redoStack.length === 0) return;

        this.isUndoRedo = true;

        const state = this.redoStack.pop();

        if (!state) {

            this.isUndoRedo = false;

            return;
        }

        this.undoStack.push(state);

        this.canvas.loadFromJSON(state).then(() => {

            this.canvas.getObjects().forEach(
                obj => {

                    if (
                        obj instanceof Rect &&
                        obj.name === "workspace"
                    ) {

                        obj
                            .set({
                                selectable: false,
                                hasControls: false
                            });

                        obj.setCoords();

                        this.updateWorkspace(obj);

                    }
                }
            );

            this.isUndoRedo = false;

            this.canvas.renderAll();
        });
    }

    private saveState = (): void => {

        if (this.isUndoRedo) return;

        if (this.transactionDepth > 0) return;

        if (this.canvas.getObjects().length === 0) return;

        const currentState = JSON.stringify(
            this.canvas
        );

        const lastState = this.undoStack[
            this.undoStack.length - 1
        ];

        if (lastState === currentState) return;

        this.undoStack.push(currentState);

        if (this.undoStack.length > 25) {
            this.undoStack.shift();
        }

        this.redoStack = [];
    };
}