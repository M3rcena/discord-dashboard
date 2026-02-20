import { CardIntent } from "./common";

export interface DashboardCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  intent?: CardIntent;
  trend?: {
    value: string;
    direction: "up" | "down" | "flat";
  };
}

export interface DashboardDesignConfig {
  bg?: string;
  rail?: string;
  contentBg?: string;
  panel?: string;
  panel2?: string;
  text?: string;
  muted?: string;
  primary?: string;
  success?: string;
  warning?: string;
  danger?: string;
  info?: string;
  border?: string;
  customCss?: string;
}

export interface DashboardTemplateRenderContext {
  dashboardName: string;
  basePath: string;
  setupDesign?: DashboardDesignConfig;
}

export type DashboardTemplateRenderer = (context: DashboardTemplateRenderContext) => string;
