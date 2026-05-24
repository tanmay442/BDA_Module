import type { SVGProps } from "react";
import { cx } from "@/utils/cx";

export const ManufacturingLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="none" {...props} className={cx("size-8", props.className)}>
        <rect x="2" y="2" width="28" height="28" rx="8" fill="currentColor" className="text-purple-600" />
        <path
            d="M16 8l2.5 1.5-.5 3L20 14l2.5-.5L24 16l-1.5 2.5-3-.5L16 20l-2.5-1.5.5-3L12 14l-2.5.5L8 16l1.5-2.5 3 .5L12 11.5l-1.5-2L16 8z"
            fill="white"
            opacity="0.9"
        />
        <circle cx="16" cy="14" r="2" fill="white" opacity="0.9" />
    </svg>
);
