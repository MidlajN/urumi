import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState
} from "react";

import {
    defineControlPoints,
    preloadAllIcons,
    setFabricDefaults
} from "./plugins/controls/controls";

import type { Canvas } from "fabric";
import { Workspace } from "./plugins/workspace/Workspace";
import CanvasRuler from "./plugins/workspace/ruler";
import CanvasGrid from "./plugins/workspace/Grid";

export const CanvasContext = createContext(null);

export const useCanvas = () => {
    return useContext(CanvasContext);
};

export function CanvasProvider({
    children
}: {
    children: React.ReactNode;
}) {

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    const toolRef = useRef("Select");

    const workspaceRef = useRef<Workspace | null>(null);

    const [canvas, setCanvas] = useState<Canvas | null>(null);

    const [canvasConfig, setCanvasConfig] = useState({
        width: 700,
        height: 1000,
        orientation: "vertical" as const,
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

        const workspace = new Workspace(
            canvasRef,
            canvasConfig,
            setCanvasConfig,
            containerRef,
            toolRef
        );

        workspaceRef.current = workspace;

        const fabricCanvas = workspace.getCanvas();

        const workspaceRect = workspace.getWorkspace();

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
            workspaceRef.current?.destroy();
        };
    }, []);

    return (
        <CanvasContext.Provider
            value={{
                canvas,
                canvasRef,
                containerRef,
                toolRef,
                workspace:
                    workspaceRef.current,
                canvasConfig,
                setCanvasConfig
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
}