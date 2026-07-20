import type {
    SvgViewBox,
} from "./types";

export function escapeXml(
    value: string
): string {

    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export function formatSvgNumber(
    value: number
): string {

    return String(
        Math.round(value * 1000) / 1000
    );
}

/**
 * Assembles the SVG document string. Knows nothing about Fabric or
 * manufacturing — it only nests groups and element markup.
 */
export class SvgBuilder {

    private lines: string[] = [];

    private depth = 1;

    openGroup(
        id: string,
        attributes: Record<string, string | number> = {}
    ) {
        this.lines.push(
            `${this.indent()}<g id="${escapeXml(id)}"${formatAttributes(attributes)}>`
        );

        this.depth += 1;
    }

    addElement(
        markup: string
    ) {
        this.lines.push(
            `${this.indent()}${markup}`
        );
    }

    closeGroup() {
        this.depth -= 1;

        this.lines.push(
            `${this.indent()}</g>`
        );
    }

    build(
        viewBox: SvgViewBox,
        dimensions?: {
            width: string;
            height: string;
        }
    ): string {

        const viewBoxValue = [
            viewBox.left,
            viewBox.top,
            viewBox.width,
            viewBox.height,
        ]
            .map(formatSvgNumber)
            .join(" ");

        const dimensionAttributes = dimensions
            ? ` width="${escapeXml(dimensions.width)}" height="${escapeXml(dimensions.height)}"`
            : "";

        return [
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxValue}"${dimensionAttributes}>`,
            ...this.lines,
            "</svg>",
        ].join("\n");
    }

    private indent() {
        return "    ".repeat(this.depth);
    }
}

export function formatAttributes(
    attributes: Record<string, string | number>
): string {

    return Object.entries(attributes)
        .map(
            ([key, value]) =>
                ` ${key}="${escapeXml(String(value))}"`
        )
        .join("");
}
