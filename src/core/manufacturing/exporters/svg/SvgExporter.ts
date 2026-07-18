import type {
    ExecutionDocument,
    ExecutionOperation,
} from "../../compiler";

import {
    SvgBuilder,
} from "./SvgBuilder";

import type {
    SvgExportOptions,
    SvgViewBox,
} from "./types";

const DEFAULT_MARGIN = 10;

/**
 * Serializes an ExecutionDocument into an SVG string, grouped by operation.
 * Geometry serialization is delegated to Fabric's own toSVG(). Consumes only
 * the document — no canvas access, no registry lookups, no Fabric mutations,
 * and no knowledge of any downstream planner.
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

                builder.addElement(
                    executionObject.fabricObject
                        .toSVG()
                        .trim()
                );
            }

            builder.closeGroup();
        }

        const viewBox =
            options.viewBox ??
            computeViewBox(
                document,
                options.margin ?? DEFAULT_MARGIN
            );

        return builder.build(
            viewBox,
            options.dimensionUnit
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
