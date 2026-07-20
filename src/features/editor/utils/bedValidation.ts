import type {
    Canvas,
    FabricObject,
    Rect,
} from "fabric";

/**
 * Tolerance in canvas units so objects touching the bed edge are not
 * classified as partially outside.
 */
const EDGE_TOLERANCE = 0.5;

const IGNORED_OBJECT_NAMES =
    new Set([
        "workspace",
        "snap-preview",
        "reference-layer",
    ]);

export type BedPlacement =
    | "inside"
    | "partial"
    | "outside";

export interface BedValidationResult {

    /** Objects straddling the bed edge — need user confirmation. */
    partial: FabricObject[];

    /** Objects fully off the bed — silently excluded. */
    outside: FabricObject[];

}

/**
 * Classifies every manufacturable object against the bed and stamps the
 * onBed flag: inside → true, outside → false. Partial objects are returned
 * for the caller to resolve (markObjectsOffBed on "ignore"); their flag is
 * set optimistically to true so cancelling leaves them manufacturable.
 */
export function validateBedPlacement(
    canvas: Canvas,
    workspace: Rect
): BedValidationResult {

    const bed = workspace.getBoundingRect();

    const partial: FabricObject[] = [];

    const outside: FabricObject[] = [];

    canvas.getObjects().forEach(
        (object) => {

            if (shouldIgnoreObject(object)) {
                return;
            }

            const placement =
                classifyPlacement(
                    object,
                    bed
                );

            if (placement === "inside") {
                object.onBed = true;
                return;
            }

            if (placement === "outside") {
                object.onBed = false;
                outside.push(object);
                return;
            }

            object.onBed = true;
            partial.push(object);
        }
    );

    return {
        partial,
        outside,
    };
}

/** Marks the given objects as off-bed (excluded from manufacturing). */
export function markObjectsOffBed(
    objects: FabricObject[]
) {
    objects.forEach(
        (object) => {
            object.onBed = false;
        }
    );
}

function classifyPlacement(
    object: FabricObject,
    bed: {
        left: number;
        top: number;
        width: number;
        height: number;
    }
): BedPlacement {

    const bounds = object.getBoundingRect();

    const bedRight = bed.left + bed.width;

    const bedBottom = bed.top + bed.height;

    const right = bounds.left + bounds.width;

    const bottom = bounds.top + bounds.height;

    const inside =
        bounds.left >= bed.left - EDGE_TOLERANCE &&
        bounds.top >= bed.top - EDGE_TOLERANCE &&
        right <= bedRight + EDGE_TOLERANCE &&
        bottom <= bedBottom + EDGE_TOLERANCE;

    if (inside) {
        return "inside";
    }

    const overlaps =
        bounds.left < bedRight - EDGE_TOLERANCE &&
        right > bed.left + EDGE_TOLERANCE &&
        bounds.top < bedBottom - EDGE_TOLERANCE &&
        bottom > bed.top + EDGE_TOLERANCE;

    return overlaps
        ? "partial"
        : "outside";
}

function shouldIgnoreObject(
    object: FabricObject
) {
    if (
        object.name &&
        IGNORED_OBJECT_NAMES.has(
            object.name
        )
    ) {
        return true;
    }

    return !object.manufacturing;
}
