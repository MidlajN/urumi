import { create } from "zustand";

export type WorkspaceMode =
    | "design"
    | "manufacturing";

interface WorkspaceState {
    mode: WorkspaceMode;

    setMode: (
        mode: WorkspaceMode
    ) => void;
}

export const useWorkspaceStore =
    create<WorkspaceState>((set) => ({
        mode: "design",

        setMode: (mode) =>
            set({
                mode,
            }),
    }));