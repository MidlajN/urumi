export interface SvgViewBox {

    left: number;

    top: number;

    width: number;

    height: number;

}

export interface SvgExportOptions {

    /**
     * Explicit view box in canvas units, e.g. the machine bed. When omitted,
     * the view box is computed from the bounds of the exported objects.
     */
    viewBox?: SvgViewBox;

    /**
     * Padding around the auto-computed bounds, in canvas units. Ignored when
     * an explicit viewBox is provided.
     */
    margin?: number;

    /**
     * When set, emits width/height attributes on the svg root equal to the
     * view box size in this unit, making the document's physical scale
     * self-describing ("px" = CSS pixels at 96 dpi, the canvas unit).
     */
    dimensionUnit?: "px" | "mm";

}
