import type { DashboardTemplateRenderer } from "../Types";
import { renderCompactLayout } from "./layouts/compact";
import { renderDefaultLayout } from "./layouts/default";
import { renderShadcnMagicLayout } from "./layouts/shadcn-magic";

export const BuiltinLayouts = {
  default: renderDefaultLayout,
  compact: renderCompactLayout,
  "shadcn-magic": renderShadcnMagicLayout,
} satisfies Record<string, DashboardTemplateRenderer>;
