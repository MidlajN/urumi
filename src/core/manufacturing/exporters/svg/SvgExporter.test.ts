import { describe, expect, it } from "vitest";
import { Circle, Line, Path, Polyline, Rect } from "fabric";
import type { FabricObject } from "fabric";

import type { Material, MaterialToolConfiguration } from "../../materials/types";
import type { ToolProfile } from "../../tools/types";
import type { ExecutionDocument } from "../../compiler";
import { SvgExporter } from "./SvgExporter";

const material: Material = {
    id: "cardboard-3mm",
    name: "Cardboard",
    thickness: 3,
    enabled: true,
    operations: {},
};

const knife: ToolProfile = {
    id: "tangential-knife",
    name: "Tangential Knife",
    enabled: true,
    offsets: { x: 0, y: 0, z: 0, a: 0 },
    defaults: { velocity: 700, acceleration: 1200 },
};

const knifeConfiguration: MaterialToolConfiguration = {
    toolId: "tangential-knife",
    enabled: true,
    isDefault: true,
    velocity: 700,
    acceleration: 1200,
    passes: 1,
};

function buildDocument(
    operations: { operationId: string; objects: FabricObject[] }[],
    bed: ExecutionDocument["bed"] = null
): ExecutionDocument {
    return {
        material,
        bed,
        operations: operations.map(({ operationId, objects }) => ({
            operationId,
            tool: knife,
            materialToolConfiguration: knifeConfiguration,
            objects: objects.map((fabricObject) => ({ fabricObject })),
        })),
    };
}

describe("SvgExporter", () => {
    it("groups flattened objects by operation with tool metadata", () => {
        const rect = new Rect({
            left: 10,
            top: 20,
            width: 100,
            height: 50,
            strokeWidth: 0,
            stroke: "#111827",
        });

        const circle = new Circle({
            left: 0,
            top: 0,
            radius: 25,
            strokeWidth: 0,
        });

        const svg = new SvgExporter().export(
            buildDocument([
                { operationId: "cut", objects: [rect] },
                { operationId: "draw", objects: [circle] },
            ])
        );

        expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="');
        expect(svg).toContain('<g id="cut" data-tool="tangential-knife" data-velocity="700" data-acceleration="1200" data-passes="1">');
        expect(svg).toContain('<g id="draw"');
        // fabric defaults origin to center: left/top (10, 20) is the center
        expect(svg).toContain('d="M -40 -5 L 60 -5 L 60 45 L -40 45 Z"');
        expect(svg).toContain('stroke="#111827"');
        expect(svg).toContain('d="M 25 0 C 25 13.807');
        // pre-normalised output: the planner ignores transform attributes
        expect(svg).not.toContain("transform=");
    });

    it("flattens path geometry to absolute coordinates", () => {
        const path = new Path("M 0 0 L 10 10", { strokeWidth: 0 });

        const svg = new SvgExporter().export(
            buildDocument([{ operationId: "cut", objects: [path] }])
        );

        expect(svg).toContain('d="M 0 0 L 10 10"');
        expect(svg).not.toContain("transform=");
    });

    it("flattens lines and polylines to absolute coordinates", () => {
        const line = new Line([0, 0, 40, 0], { strokeWidth: 0 });

        const polyline = new Polyline(
            [
                { x: 0, y: 0 },
                { x: 10, y: 0 },
                { x: 10, y: 10 },
            ],
            { strokeWidth: 0 }
        );

        const svg = new SvgExporter().export(
            buildDocument([
                { operationId: "crease", objects: [line, polyline] },
            ])
        );

        expect(svg).toContain('d="M 0 0 L 40 0"');
        expect(svg).toContain('d="M 0 0 L 10 0 L 10 10"');
    });

    it("skips unsupported object types and falls back to an empty view box", () => {
        const svg = new SvgExporter().export(
            buildDocument([{ operationId: "cut", objects: [] }])
        );

        expect(svg).toContain('viewBox="0 0 1 1"');
    });

    it("uses an explicit view box when provided", () => {
        const svg = new SvgExporter().export(
            buildDocument([]),
            { viewBox: { left: 0, top: 0, width: 300, height: 400 } }
        );

        expect(svg).toContain('viewBox="0 0 300 400"');
    });

    it("anchors the view box to the document bed with mm dimensions", () => {
        // 300mm × 400mm bed in canvas px (96 dpi)
        const bed = {
            left: 0,
            top: 0,
            width: (300 * 96) / 25.4,
            height: (400 * 96) / 25.4,
        };

        const rect = new Rect({
            left: 100,
            top: 100,
            width: 50,
            height: 50,
            strokeWidth: 0,
        });

        const svg = new SvgExporter().export(
            buildDocument([{ operationId: "cut", objects: [rect] }], bed)
        );

        expect(svg).toContain('viewBox="0 0 1133.858 1511.811"');
        expect(svg).toContain('width="300mm" height="400mm"');
    });
});
