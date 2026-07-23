import type { ReactNode } from "react";
import type { FabricObject } from "fabric";

type OperationObject = FabricObject & {
    getObjects?: () => FabricObject[];
};

/** Flattens an active selection (or single object) into its leaf objects. */
export function getOperationTargets(
    object: FabricObject | null | undefined
): FabricObject[] {
    if (!object) return [];

    const maybeCollection = object as OperationObject;

    if (typeof maybeCollection.getObjects === "function") {
        return maybeCollection
            .getObjects()
            .flatMap(getOperationTargets);
    }

    return [object];
}

export function isTextObject(object: FabricObject) {
    return ["i-text", "text", "textbox"].includes(object.type);
}

/** Text carries its operation color on fill, everything else on stroke. */
export function getObjectOperationColor(object: FabricObject) {
    const value = isTextObject(object)
        ? object.get("fill")
        : object.get("stroke");

    return typeof value === "string" ? value : null;
}

export function applyOperationColor(
    object: FabricObject,
    color: string
) {
    object.set(
        isTextObject(object)
            ? { fill: color }
            : { stroke: color }
    );

    object.setCoords();
}

export function PanelSection({
    title,
    meta,
    children
}: {
    title: string;
    meta?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="border-b border-zinc-200/80 px-4 py-4">
            <h3 className="mb-3 flex items-baseline justify-between text-[11px] font-bold uppercase text-zinc-500">
                <span>{title}</span>
                {meta && (
                    <span className="font-medium normal-case text-zinc-400">
                        {meta}
                    </span>
                )}
            </h3>
            {children}
        </section>
    );
}
