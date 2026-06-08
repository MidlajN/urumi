// preloading all the control icons and cache them

import ReactDOMServer from "react-dom/server";
import type { ComponentType } from "react";

let iconCache: Record<string | number, HTMLImageElement> = {};

export const preloadIcon = (Component: ComponentType<any>, name: string | number) => {
    return new Promise<void>((resolve) => {
        const svgString = ReactDOMServer.renderToStaticMarkup(<Component />);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            iconCache[name] = img;
            resolve();
        };
        img.src = url;
    });
};

export const getIcon = (name: string | number) => iconCache[name]