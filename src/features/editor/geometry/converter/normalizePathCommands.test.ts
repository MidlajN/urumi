import {
    describe,
    expect,
    it
} from "vitest";

import { normalizePathCommands } from "./normalizePathCommands";
import type { PathCommand } from "./types";

describe(
    "fabricPathToGeometry",
    () => {
        it("passes through canonical commands", () => {
            const commands: PathCommand[] = [
                ["M", 0, 0],
                ["L", 10, 10],
                ["C", 20, 20, 30, 30, 40, 40],
                ["Z"]
            ];

            expect(
                normalizePathCommands(commands)
            ).toEqual(commands);
        });

        it("converts horizontal lines", () => {
            expect(
                normalizePathCommands([
                    ["M", 10, 20],
                    ["H", 50]
                ])
            ).toEqual([
                ["M", 10, 20],
                ["L", 50, 20]
            ]);
        });

        it("converts vertical lines", () => {
            expect(
                normalizePathCommands([
                    ["M", 10, 20],
                    ["V", 80]
                ])
            ).toEqual([
                ["M", 10, 20],
                ["L", 10, 80]
            ]);
        });

        it("converts quadratic curves to cubic curves", () => {
            const result =
                normalizePathCommands([
                    ["M", 0, 0],
                    ["Q", 50, 100, 100, 0]
                ]);

            expect(result[0]).toEqual([
                "M",
                0,
                0
            ]);

            expect(result[1][0]).toBe("C");

            const cubic =
                result[1];

            expect(cubic[5]).toBe(100);
            expect(cubic[6]).toBe(0);
        });

        it("normalizes free draw paths", () => {
            const commands: PathCommand[] = [
                ["M", 100, 100],
                ["Q", 150, 150, 200, 200],
                ["Q", 250, 250, 300, 300],
                ["L", 400, 400]
            ];

            const normalized =
                normalizePathCommands(commands);

            expect(
                normalized.every(
                    (command) =>
                        command[0] === "M" ||
                        command[0] === "L" ||
                        command[0] === "C" ||
                        command[0] === "Z"
                )
            ).toBe(true);
        });

    }
);