import { DashboardScope, DashboardBoxWidth } from "./common";
import { DashboardContext } from "./discord";
import { PluginActionResult } from "./plugin";

export type HomeFieldType = "text" | "textarea" | "number" | "select" | "boolean" | "role-search" | "channel-search" | "member-search" | "string-list";

export interface HomeLookupConfig {
  limit?: number;
  minQueryLength?: number;
  nsfw?: boolean;
  channelTypes?: number[];
  includeManaged?: boolean;
}

export interface HomeFieldOption {
  label: string;
  value: string;
}

export interface HomeCategory {
  id: string;
  label: string;
  scope: DashboardScope;
  description?: string;
}

export interface HomeSectionField {
  id: string;
  label: string;
  type: HomeFieldType;
  value?: string | number | boolean | string[] | Record<string, unknown>;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  options?: HomeFieldOption[];
  lookup?: HomeLookupConfig;
}

export interface HomeSectionAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
}

export interface HomeSection {
  id: string;
  title: string;
  description?: string;
  width?: DashboardBoxWidth;
  scope?: DashboardScope;
  categoryId?: string;
  fields?: HomeSectionField[];
  actions?: HomeSectionAction[];
}

export interface HomeActionPayload {
  sectionId: string;
  values: Record<string, unknown>;
}

export interface DashboardHomeBuilder {
  getOverviewSections?: (context: DashboardContext) => Promise<HomeSection[]> | HomeSection[];
  getCategories?: (context: DashboardContext) => Promise<HomeCategory[]> | HomeCategory[];
  getSections?: (context: DashboardContext) => Promise<HomeSection[]> | HomeSection[];
  actions?: Record<string, (context: DashboardContext, payload: HomeActionPayload) => Promise<PluginActionResult> | PluginActionResult>;
}
