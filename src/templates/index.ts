import type { DashboardTemplateRenderer } from "../Types";
import { compactDashboardTemplateRenderer } from "./compact";
import { defaultDashboardTemplateRenderer } from "./default";
import { shadcnMagicDashboardTemplateRenderer } from "./shadcn-magic";

export const builtinTemplateRenderers: Record<string, DashboardTemplateRenderer> = {
  default: defaultDashboardTemplateRenderer,
  compact: compactDashboardTemplateRenderer,
  "shadcn-magic": shadcnMagicDashboardTemplateRenderer,
};


export function getBuiltinTemplateRenderer(templateId: string): DashboardTemplateRenderer | undefined {
  return builtinTemplateRenderers[templateId];
}
