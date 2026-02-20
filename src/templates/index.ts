import type { DashboardTemplateRenderer } from "../Types";
import { renderCompactLayout } from "./layouts/compact";
import { renderDefaultLayout } from "./layouts/default";
import { renderShadcnMagicLayout } from "./layouts/shadcn-magic";

export const BuiltinLayouts: Record<string, DashboardTemplateRenderer> = {
  default: renderDefaultLayout,
  compact: renderCompactLayout,
  "shadcn-magic": renderShadcnMagicLayout,
};
