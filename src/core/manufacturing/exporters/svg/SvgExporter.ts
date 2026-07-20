import type {
    ExecutionDocument,
    ExecutionOperation,
} from "../../compiler";

import {
    SvgBuilder,
} from "./SvgBuilder";

import {
    formatSvgNumber,
} from "./SvgBuilder";

import {
    serializeObject,
} from "./serializeObject";

import type {
    SvgExportOptions,
    SvgViewBox,
} from "./types";

const DEFAULT_MARGIN = 10;

/** Canvas units are CSS px at 96 dpi. */
const MM_PER_PX = 25.4 / 96;

/**
 * Serializes an ExecutionDocument into an SVG string, grouped by operation.
 * The document maps the machine bed: the view box is the bed rect and the
 * root carries the bed's physical size in millimetres, so the geometry is
 * bed-anchored and to scale for any consumer. Objects are flattened to
 * absolute-coordinate paths with no transform attributes (pre-normalised
 * SVG — see serializeObject). Consumes only the document — no canvas
 * access, no registry lookups, no Fabric mutations, and no knowledge of any
 * downstream planner.
 */
export class SvgExporter {

    export(
        document: ExecutionDocument,
        options: SvgExportOptions = {}
    ): string {

        const builder = new SvgBuilder();

        for (const operation of document.operations) {

            builder.openGroup(
                operation.operationId,
                operationAttributes(operation)
            );

            for (const executionObject of operation.objects) {

                const markup = serializeObject(
                    executionObject.fabricObject
                );

                if (markup) {
                    builder.addElement(markup);
                }
            }

            builder.closeGroup();
        }

        const viewBox =
            options.viewBox ??
            document.bed ??
            computeViewBox(
                document,
                options.margin ?? DEFAULT_MARGIN
            );

        return builder.build(
            viewBox,
            {
                width: `${formatSvgNumber(viewBox.width * MM_PER_PX)}mm`,
                height: `${formatSvgNumber(viewBox.height * MM_PER_PX)}mm`,
            }
        );
    }
}

function operationAttributes(
    operation: ExecutionOperation
): Record<string, string | number> {

    const configuration =
        operation.materialToolConfiguration;

    return {
        "data-tool": operation.tool.id,
        "data-velocity": configuration.velocity,
        "data-acceleration": configuration.acceleration,
        "data-passes": configuration.passes,
    };
}

function computeViewBox(
    document: ExecutionDocument,
    margin: number
): SvgViewBox {

    let left = Infinity;

    let top = Infinity;

    let right = -Infinity;

    let bottom = -Infinity;

    for (const operation of document.operations) {

        for (const executionObject of operation.objects) {

            const bounds =
                executionObject.fabricObject.getBoundingRect();

            left = Math.min(left, bounds.left);
            top = Math.min(top, bounds.top);
            right = Math.max(right, bounds.left + bounds.width);
            bottom = Math.max(bottom, bounds.top + bounds.height);
        }
    }

    if (left === Infinity) {
        return {
            left: 0,
            top: 0,
            width: 1,
            height: 1,
        };
    }

    return {
        left: left - margin,
        top: top - margin,
        width: right - left + margin * 2,
        height: bottom - top + margin * 2,
    };
}
