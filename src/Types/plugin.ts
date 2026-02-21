import { DashboardScope, DashboardBoxWidth } from "./common";
import { DashboardContext } from "./discord";
import { HomeFieldType, HomeLookupConfig, HomeFieldOption } from "./home";

export interface PluginActionResult {
  ok: boolean;
  message?: string;
  refresh?: boolean;
  data?: unknown;
}

export interface PluginPanelField {
  id?: string;
  label: string;
  value: string | number | boolean | string[] | Record<string, unknown>;
  type?: HomeFieldType | "url";
  editable?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: HomeFieldOption[];
  lookup?: HomeLookupConfig;
}

export interface PluginPanelAction {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  collectFields?: boolean;
}

export interface PluginPanel {
  id: string;
  title: string;
  description?: string;
  width?: DashboardBoxWidth;
  fields?: PluginPanelField[];
  actions?: PluginPanelAction[];
}

export interface DashboardPlugin {
  id: string;
  name: string;
  description?: string;
  scope?: DashboardScope | "both";
  panels?: PluginPanel[];
  getPanels?: (context: DashboardContext) => Promise<PluginPanel[]> | PluginPanel[];
  actions?: Record<string, (context: DashboardContext, body: unknown) => Promise<PluginActionResult> | PluginActionResult>;
}
