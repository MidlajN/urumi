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

export function getCompanionReferenceUrl(
    peerId: string
) {
    console.log("dldl " , {
        COMPANION_APP_URL,
        peerId
    });

    if (
        !COMPANION_APP_URL
    ) {
        return "";
    }

    const url =
        new URL(
            `${COMPANION_APP_URL}/reference`
        );

    url.searchParams.set(
        "peer",
        peerId
    );

    // console.log(url.toString());

    return url.toString();
}
