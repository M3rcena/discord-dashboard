import type { DashboardTemplateRenderer } from "../Types";
import { renderDashboardHtml } from "./templates";

export const defaultDashboardTemplateRenderer: DashboardTemplateRenderer = ({ dashboardName, basePath, setupDesign }) => renderDashboardHtml(dashboardName, basePath, setupDesign);
