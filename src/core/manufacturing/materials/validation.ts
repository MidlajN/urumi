import type {
    Material,
} from "./types";

export function isValidMaterial(
    value: unknown
): value is Material {

    return (
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "operations" in value
    );
}