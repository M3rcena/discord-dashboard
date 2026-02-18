import { renderDashboardHtml } from "../templates";
import type { DashboardTemplateRenderer } from "../types";

export const defaultDashboardTemplateRenderer: DashboardTemplateRenderer = ({
  dashboardName,
  basePath,
  setupDesign
}) => renderDashboardHtml(dashboardName, basePath, setupDesign);
