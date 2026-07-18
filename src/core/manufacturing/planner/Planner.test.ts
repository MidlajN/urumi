import { beforeAll, describe, expect, it } from "vitest";
import { DOMParser } from "@xmldom/xmldom";
import { setDOMParser, PLAN_MAGIC } from "urumi-toolpath";
import { Rect } from "fabric";
import type { FabricObject } from "fabric";

import type { Material, MaterialToolConfiguration } from "../materials/types";
import type { ToolProfile } from "../tools/types";
import type { ExecutionDocument } from "../compiler";
import { Planner } from "./Planner";
import { buildPlannerConfig } from "./PlannerConfigBuilder";

beforeAll(() => {
    // urumi-toolpath parses SVG via DOMParser, which Node lacks.
    setDOMParser(() => new DOMParser() as never);
});

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

function knifeConfiguration(
    passes = 1
): MaterialToolConfiguration {
    return {
        toolId: "tangential-knife",
        enabled: true,
        isDefault: true,
        velocity: 700,
        acceleration: 1200,
        passes,
    };
}

function buildDocument(
    objects: FabricObject[],
    passes = 1
): ExecutionDocument {
    return {
        material,
        operations: [
            {
                operationId: "cut",
                tool: knife,
                materialToolConfiguration: knifeConfiguration(passes),
                objects: objects.map((fabricObject) => ({ fabricObject })),
            },
        ],
    };
}

function testRect() {
    return new Rect({
        left: 200,
        top: 200,
        width: 150,
        height: 100,
        strokeWidth: 0,
        stroke: "#111827",
    });
}

describe("buildPlannerConfig", () => {
    it("keys a derived tool profile by operation id with material values", () => {
        const config = buildPlannerConfig(
            buildDocument([testRect()]),
            JSON.stringify({
                machine: {
                    fCpu: 150000000,
                    x: { stepsPerUnit: 26.5, node: { nodeId: 1 } },
                    y: { stepsPerUnit: 26.5, node: { nodeId: 2 } },
                },
                heads: [
                    {
                        tool: "knife",
                        z: { stepsPerUnit: 400, node: { nodeId: 3 } },
                        a: { stepsPerUnit: 8.889, node: { nodeId: 4 }, rotary: true },
                    },
                ],
            })
        );

        const profile = config.toolProfiles["cut"];

        expect(profile).toBeDefined();
        expect(profile.name).toBe("cut");
        expect(profile.tangential).toBe(true);
        expect(profile.feedMax).toBe(700);
        expect(profile.accel).toBe(1200);
    });

    it("rejects an invalid machine profile with the loader's errors", () => {
        expect(() =>
            buildPlannerConfig(buildDocument([testRect()]), "{}")
        ).toThrow(/machine/);
    });

    it("rejects a tool with no planner preset", () => {
        const document = buildDocument([testRect()]);

        document.operations[0] = {
            ...document.operations[0],
            tool: { ...knife, id: "laser" },
        };

        expect(() =>
            buildPlannerConfig(
                document,
                JSON.stringify({
                    machine: {
                        fCpu: 150000000,
                        x: { stepsPerUnit: 26.5, node: { nodeId: 1 } },
                        y: { stepsPerUnit: 26.5, node: { nodeId: 2 } },
                    },
                    heads: [
                        {
                            tool: "knife",
                            z: { stepsPerUnit: 400, node: { nodeId: 3 } },
                            a: { stepsPerUnit: 8.889, node: { nodeId: 4 } },
                        },
                    ],
                })
            )
        ).toThrow(/laser/);
    });
});

describe("Planner", () => {
    it("plans an execution document into motion blocks and .plan bytes", () => {
        const result = new Planner().plan(buildDocument([testRect()]));

        expect(result.plan.blocks).toHaveLength(1);

        const block = result.plan.blocks[0];

        expect(block.profile.name).toBe("cut");
        expect(block.profile.feedMax).toBe(700);
        expect(block.segments.length).toBeGreaterThan(0);

        expect(result.bytes.length).toBeGreaterThan(0);
        expect(result.bytes[0]).toBe(PLAN_MAGIC[0]);

        // the baked config rides along for the run phase and inspection
        expect(result.config.toolProfiles["cut"].feedMax).toBe(700);
        expect(result.config.machine.x.stepsPerUnit).toBeGreaterThan(0);
    });

    it("repeats an operation's block per configured pass", () => {
        const single = new Planner().plan(buildDocument([testRect()], 1));
        const triple = new Planner().plan(buildDocument([testRect()], 3));

        expect(single.plan.blocks).toHaveLength(1);
        expect(triple.plan.blocks).toHaveLength(3);
        expect(triple.plan.blocks[0].segments).toEqual(
            triple.plan.blocks[1].segments
        );
    });

    it("anchors machine coordinates to an explicit bed view box", () => {
        const anchored = new Planner().plan(buildDocument([testRect()]), {
            viewBox: { left: 0, top: 0, width: 1134, height: 1512 },
        });

        const floating = new Planner().plan(buildDocument([testRect()]));

        expect(anchored.plan.blocks[0].startSteps).not.toEqual(
            floating.plan.blocks[0].startSteps
        );
    });
});
