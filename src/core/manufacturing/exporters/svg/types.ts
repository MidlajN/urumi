export interface SvgViewBox {

    left: number;

    top: number;

    width: number;

    height: number;

}

export interface SvgExportOptions {

    /**
     * Explicit view box in canvas units. When omitted, the document's bed is
     * used; content bounds are the fallback when the document has no bed.
     */
    viewBox?: SvgViewBox;

    /**
     * Padding around the auto-computed content bounds, in canvas units. Only
     * applies to the no-bed fallback.
     */
    margin?: number;

}
