const companionUrl =
    import.meta.env.VITE_COMPANION_APP_URL;

export const COMPANION_APP_URL =
    typeof companionUrl === "string" &&
    companionUrl.trim().length > 0
        ? companionUrl.replace(
            /\/$/,
            ""
        )
        : "";
