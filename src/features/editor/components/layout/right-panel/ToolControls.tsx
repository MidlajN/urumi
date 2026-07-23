import { useEditorStore } from "../../../store/editor.store";
import { PanelSection } from "./shared";

const fontOptions = [
    "BobaMilky",
    "Arial",
    "Inter",
    "Helvetica"
];

function ShapeControls() {
    const { selectedShape } = useEditorStore();

    return (
        <PanelSection title="Shape">
            <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-[13px] font-medium text-zinc-800">
                <span>Current shape</span>
                <span className="capitalize">
                    {selectedShape}
                </span>
            </div>
        </PanelSection>
    );
}

function TextControls() {
    const {
        fontFamily,
        fontSize,
        setFontFamily,
        setFontSize
    } = useEditorStore();

    return (
        <PanelSection title="Text">
            <div className="space-y-3">
                <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-zinc-500">
                        Font
                    </span>
                    <select
                        value={fontFamily}
                        onChange={(event) =>
                            setFontFamily(event.target.value)
                        }
                        className="
                            h-9
                            w-full
                            rounded-md
                            border
                            border-zinc-200
                            bg-white
                            px-2
                            text-[13px]
                            font-medium
                            text-zinc-800
                            outline-none
                        "
                    >
                        {fontOptions.map((font) => (
                            <option key={font} value={font}>
                                {font}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-[12px] font-semibold text-zinc-500">
                        Font size
                    </span>
                    <input
                        type="number"
                        min={8}
                        max={160}
                        step={1}
                        value={fontSize}
                        onChange={(event) =>
                            setFontSize(
                                Number(event.target.value)
                            )
                        }
                        className="
                            h-9
                            w-full
                            rounded-md
                            border
                            border-zinc-200
                            px-2
                            text-[13px]
                            font-medium
                            text-zinc-800
                            outline-none
                        "
                    />
                </label>
            </div>
        </PanelSection>
    );
}

/** Per-tool extras shown in the no-selection state. */
export default function ToolSpecificControls() {
    const { activeTool } = useEditorStore();

    if (activeTool === "shape") {
        return <ShapeControls />;
    }

    if (activeTool === "text") {
        return <TextControls />;
    }

    return null;
}
