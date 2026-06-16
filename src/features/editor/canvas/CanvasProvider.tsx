import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type Dispatch,
    type RefObject,
    type SetStateAction
} from "react";

import {
    defineControlPoints,
    preloadAllIcons,
    setFabricDefaults
} from "./plugins/controls/controls";

import type { Canvas } from "fabric";
import { Workspace } from "./engine/Workspace";
import CanvasRuler from "./plugins/workspace/ruler";
import CanvasGrid from "./plugins/workspace/Grid";



type CanvasConfig = {
    width: number;
    height: number;
    orientation: "vertical" | "horizontal";
    maxWidth: number;
    maxHeight: number;
};

type CanvasContextType = {
    canvas: Canvas | null;
    canvasRef: RefObject<HTMLCanvasElement | null>;
    containerRef: RefObject<HTMLDivElement | null>;
    toolRef: RefObject<string>;
    workspace: Workspace | null;
    canvasConfig: CanvasConfig;
    setCanvasConfig: Dispatch<
        SetStateAction<CanvasConfig>
    >;
};

export const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
    const context =
        useContext(CanvasContext);

    if (!context) {
        throw new Error(
            "useCanvas must be used inside CanvasProvider"
        );
    }

    return context;
};

export function CanvasProvider({
    children
}: {
    children: React.ReactNode;
}) {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    const toolRef = useRef("Select");

    const [workspace, setWorkspace] = useState<Workspace | null>(null);

    const [canvas, setCanvas] = useState<Canvas | null>(null);

    const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
        width: 1000,
        height: 700,
        orientation: "vertical",
        maxWidth: 700,
        maxHeight: 1000
    });

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current ) {
            return;
        }

        const initCanvas = async () => {
            setFabricDefaults();
            await preloadAllIcons();
            defineControlPoints();
        }

        const cleanupPromise = initCanvas()

        const workspaceInstance = new Workspace(
            canvasRef,
            canvasConfig,
            setCanvasConfig,
            containerRef,
            toolRef
        );

        setWorkspace(workspaceInstance)

        const fabricCanvas = workspaceInstance.getCanvas();

        const workspaceRect = workspaceInstance.getWorkspace();

        const grid = new CanvasGrid(
            fabricCanvas,
            workspaceRect
        )

        grid.enable()

        setCanvas(fabricCanvas);

        const ruler = new CanvasRuler(
            fabricCanvas,
            workspaceRect
        );

        ruler.rulerEnable();

        // const savedCanvas = localStorage.getItem('polyPlotCanvas');
        // const parsedCanvas = JSON.parse(savedCanvas);

        return () => {
            workspaceInstance?.destroy();
        };

    }, []);

    return (
        <CanvasContext.Provider
            value={{
                canvas,
                canvasRef,
                containerRef,
                toolRef,
                workspace,
                canvasConfig,
                setCanvasConfig
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
}