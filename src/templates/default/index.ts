import type { DashboardTemplateRenderer } from "../../Types";
import { renderDefaultDashboardHtml } from "./render";

export const defaultDashboardTemplateRenderer: DashboardTemplateRenderer = ({ dashboardName, basePath, setupDesign }) =>
  renderDefaultDashboardHtml(dashboardName, basePath, setupDesign);
