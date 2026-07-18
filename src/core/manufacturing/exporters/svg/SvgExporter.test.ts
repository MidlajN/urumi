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
    operations: { operationId: string; objects: FabricObject[] }[]
): ExecutionDocument {
    return {
        material,
        operations: operations.map(({ operationId, objects }) => ({
            operationId,
            tool: knife,
            materialToolConfiguration: knifeConfiguration,
            objects: objects.map((fabricObject) => ({ fabricObject })),
        })),
    };
}

describe("SvgExporter", () => {
    it("groups serialized objects by operation with tool metadata", () => {
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
        expect(svg).toContain('x="-50" y="-25" rx="0" ry="0" width="100" height="50"');
        expect(svg).toContain("stroke: rgb(17,24,39)");
        // fabric defaults origin to center, so left/top is the rect center
        expect(svg).toContain('transform="matrix(1 0 0 1 10 20)"');
        expect(svg).toContain('cx="0" cy="0" r="25"');
    });

    it("preserves path geometry through the pathOffset transform", () => {
        const path = new Path("M 0 0 L 10 10", { strokeWidth: 0 });

        const svg = new SvgExporter().export(
            buildDocument([{ operationId: "cut", objects: [path] }])
        );

        expect(svg).toContain('d="M 0 0 L 10 10"');
        // fabric emits the object transform plus the -pathOffset translate
        expect(svg).toContain('transform="matrix(1 0 0 1 5 5)"');
        expect(svg).toContain("translate(-5, -5)");
    });

    it("serializes lines and polylines in local coordinates", () => {
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

        expect(svg).toContain('x1="-20" y1="0" x2="20" y2="0"');
        expect(svg).toContain('points="-5,-5 5,-5 5,5"');
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
});
