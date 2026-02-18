import type { DashboardTemplateRenderer } from "../types";
import { compactDashboardTemplateRenderer } from "./compact";
import { defaultDashboardTemplateRenderer } from "./default";

export const builtinTemplateRenderers: Record<string, DashboardTemplateRenderer> = {
  default: defaultDashboardTemplateRenderer,
  compact: compactDashboardTemplateRenderer
};

export function getBuiltinTemplateRenderer(templateId: string): DashboardTemplateRenderer | undefined {
  return builtinTemplateRenderers[templateId];
}
