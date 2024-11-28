import { forwardRef } from "react";
import { LucideIcon } from "lucide-react";

export const BrandX: LucideIcon = forwardRef((props, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    ref={ref}
    {...props}
  >
    <path d="M4 4l7.2 8.8L4 20h3.3l5.5-5.9 4.5 5.9H22l-7.6-9.3L21.7 4h-3.3l-5.1 5.5-4.2-5.5H4zm3.7 2h2.4l7.7 10-2.4 2.7-7.7-10v-2.7z" />
  </svg>
));

BrandX.displayName = "BrandX";
