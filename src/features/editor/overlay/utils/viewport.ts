import {
    Point,
    util,
} from "fabric";

import type {
    OverlayRef,
    SelectionGeometry,
} from "../types";

export function viewportPointerToScene(
    geometry: SelectionGeometry,
    overlayRef: OverlayRef,
    event: PointerEvent
) {
    const rect =
        overlayRef.current
            ?.getBoundingClientRect();

    if (!rect) {
        return null;
    }

    return new Point(
        event.clientX -
            rect.left,
        event.clientY -
            rect.top
    ).transform(
        util.invertTransform(
            geometry.viewportTransform
        )
    );
}
