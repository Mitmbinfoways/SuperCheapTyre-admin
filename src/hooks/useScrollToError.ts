import { useEffect } from "react";

export const useScrollToError = (errors: any) => {
    useEffect(() => {
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            const elements = errorKeys
                .map((key) => {
                    let el = document.querySelector(`[name="${key}"]`);
                    if (!el) el = document.getElementById(key);
                    if (!el) el = document.querySelector(`[data-name="${key}"]`);
                    return el;
                })
                .filter((el) => el !== null) as HTMLElement[];

            if (elements.length > 0) {
                // Sort elements by their position in the DOM to find the top-most one
                elements.sort((a, b) => {
                    const rectA = a.getBoundingClientRect();
                    const rectB = b.getBoundingClientRect();
                    return rectA.top - rectB.top;
                });

                const firstElement = elements[0];
                firstElement.scrollIntoView({ behavior: "smooth", block: "center" });

                // Try to focus the element itself, or find a focusable child
                if (firstElement.tabIndex >= 0 || firstElement.tagName === "INPUT" || firstElement.tagName === "TEXTAREA" || firstElement.tagName === "SELECT" || firstElement.tagName === "BUTTON") {
                    firstElement.focus({ preventScroll: true });
                } else {
                    const focusableData = firstElement.querySelector('input, textarea, select, button, [tabindex]:not([tabindex="-1"])') as HTMLElement;
                    if (focusableData) focusableData.focus({ preventScroll: true });
                }
            }
        }
    }, [errors]);
};
