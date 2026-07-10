import type {
    ToolProfile,
} from "./types";

export function isValidToolProfile(
    value: unknown
): value is ToolProfile {
    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "name" in value
    );
}