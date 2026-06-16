import {
    useCallback,
    useEffect,
    useState
} from "react";
import {
    Point,
    type Canvas,
    type FabricObject
} from "fabric";

type ViewportRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};

export type SelectionGeometry = {
    object: FabricObject;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    viewport: ViewportRect;
};

export type SelectionGeometryPatch = Partial<
    Pick<
        SelectionGeometry,
        | "x"
        | "y"
        | "width"
        | "height"
        | "rotation"
    >
>;

const MIN_DIMENSION =
    1;

function toViewportRect(
    rect: ViewportRect,
    canvas: Canvas
): ViewportRect {
    const points = [
        new Point(
            rect.left,
            rect.top
        ),
        new Point(
            rect.left +
                rect.width,
            rect.top
        ),
        new Point(
            rect.left +
                rect.width,
            rect.top +
                rect.height
        ),
        new Point(
            rect.left,
            rect.top +
                rect.height
        )
    ].map((point) =>
        point.transform(
            canvas.viewportTransform
        )
    );

    const xs =
        points.map(
            (
                point
            ) =>
                point.x
        );

    const ys =
        points.map(
            (
                point
            ) =>
                point.y
        );

    const left =
        Math.min(
            ...xs
        );

    const top =
        Math.min(
            ...ys
        );

    return {
        left,
        top,
        width:
            Math.max(
                ...xs
            ) -
            left,
        height:
            Math.max(
                ...ys
            ) -
            top
    };
}

function readSelectionGeometry(
    canvas: Canvas
): SelectionGeometry | null {
    const object =
        canvas.getActiveObject();

    if (!object) {
        return null;
    }

    const bounds =
        object.getBoundingRect();

    return {
        object,
        x:
            bounds.left,
        y:
            bounds.top,
        width:
            object.getScaledWidth(),
        height:
            object.getScaledHeight(),
        rotation:
            object.angle ??
            0,
        viewport:
            toViewportRect(
                {
                    left:
                        bounds.left,
                    top:
                        bounds.top,
                    width:
                        bounds.width,
                    height:
                        bounds.height
                },
                canvas
            )
    };
}

function cleanNumber(
    value: number | undefined
) {
    if (
        typeof value !==
            "number" ||
        Number.isNaN(
            value
        )
    ) {
        return undefined;
    }

    return value;
}

export function formatMeasurement(
    value: number
) {
    const rounded =
        Math.round(
            value * 100
        ) / 100;

    const normalized =
        Object.is(
            rounded,
            -0
        )
            ? 0
            : rounded;

    return normalized
        .toFixed(
            2
        )
        .replace(
            /(\.\d*?)0+$/,
            "$1"
        )
        .replace(
            /\.$/,
            ".0"
        );
}

export function parseMeasurement(
    value: string
) {
    const normalized =
        value.replace(
            /mm|deg/gi,
            ""
        )
            .trim();

    if (!normalized) {
        return null;
    }

    const parsed =
        Number(
            normalized
        );

    return Number.isFinite(
        parsed
    )
        ? parsed
        : null;
}

export function useSelectionGeometry(
    canvas: Canvas | null
) {
    const [
        geometry,
        setGeometry
    ] = useState<SelectionGeometry | null>(
        null
    );

    const syncGeometry =
        useCallback(() => {
            setGeometry(
                canvas
                    ? readSelectionGeometry(
                        canvas
                    )
                    : null
            );
        }, [
            canvas
        ]);

    useEffect(() => {
        if (!canvas) {
            setGeometry(
                null
            );
            return;
        }

        syncGeometry();

        canvas.on(
            "selection:created",
            syncGeometry
        );
        canvas.on(
            "selection:updated",
            syncGeometry
        );
        canvas.on(
            "selection:cleared",
            syncGeometry
        );
        canvas.on(
            "object:moving",
            syncGeometry
        );
        canvas.on(
            "object:scaling",
            syncGeometry
        );
        canvas.on(
            "object:rotating",
            syncGeometry
        );
        canvas.on(
            "object:modified",
            syncGeometry
        );
        canvas.on(
            "after:render",
            syncGeometry
        );

        return () => {
            canvas.off(
                "selection:created",
                syncGeometry
            );
            canvas.off(
                "selection:updated",
                syncGeometry
            );
            canvas.off(
                "selection:cleared",
                syncGeometry
            );
            canvas.off(
                "object:moving",
                syncGeometry
            );
            canvas.off(
                "object:scaling",
                syncGeometry
            );
            canvas.off(
                "object:rotating",
                syncGeometry
            );
            canvas.off(
                "object:modified",
                syncGeometry
            );
            canvas.off(
                "after:render",
                syncGeometry
            );
        };
    }, [
        canvas,
        syncGeometry
    ]);

    const updateGeometry =
        useCallback((
            patch: SelectionGeometryPatch
        ) => {
            if (!canvas) {
                return;
            }

            const object =
                canvas.getActiveObject();

            if (!object) {
                return;
            }

            const nextWidth =
                cleanNumber(
                    patch.width
                );

            const nextHeight =
                cleanNumber(
                    patch.height
                );

            const nextRotation =
                cleanNumber(
                    patch.rotation
                );

            const nextX =
                cleanNumber(
                    patch.x
                );

            const nextY =
                cleanNumber(
                    patch.y
                );

            const preserveCenter =
                nextWidth !==
                    undefined ||
                nextHeight !==
                    undefined ||
                nextRotation !==
                    undefined;

            const center =
                preserveCenter
                    ? object.getCenterPoint()
                    : null;

            if (
                nextWidth !==
                    undefined &&
                nextWidth >
                    MIN_DIMENSION
            ) {
                const currentWidth =
                    object.getScaledWidth();

                if (
                    currentWidth >
                    MIN_DIMENSION
                ) {
                    object.set({
                        scaleX:
                            (object.scaleX ??
                                1) *
                            (nextWidth /
                                currentWidth)
                    });
                }
            }

            if (
                nextHeight !==
                    undefined &&
                nextHeight >
                    MIN_DIMENSION
            ) {
                const currentHeight =
                    object.getScaledHeight();

                if (
                    currentHeight >
                    MIN_DIMENSION
                ) {
                    object.set({
                        scaleY:
                            (object.scaleY ??
                                1) *
                            (nextHeight /
                                currentHeight)
                    });
                }
            }

            if (
                nextRotation !==
                undefined
            ) {
                object.set({
                    angle:
                        nextRotation
                });
            }

            if (center) {
                object.setPositionByOrigin(
                    center,
                    "center",
                    "center"
                );
            }

            object.setCoords();

            if (
                nextX !==
                    undefined ||
                nextY !==
                    undefined
            ) {
                const bounds =
                    object.getBoundingRect();

                object.set({
                    left:
                        (object.left ??
                            0) +
                        (nextX ??
                            bounds.left) -
                        bounds.left,
                    top:
                        (object.top ??
                            0) +
                        (nextY ??
                            bounds.top) -
                        bounds.top
                });

                object.setCoords();
            }

            canvas.fire(
                "object:modified",
                {
                    target:
                        object
                }
            );

            canvas.requestRenderAll();
            setGeometry(
                readSelectionGeometry(
                    canvas
                )
            );
        }, [
            canvas
        ]);

    return {
        geometry,
        updateGeometry
    };
}
