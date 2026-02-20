import type { DashboardTemplateRenderer } from "../../Types";
import { renderDefaultDashboardHtml } from "../default/render";
import { compactAppCss, renderCompactLayoutBody, renderCompactLayoutDocument } from "./layout";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function extractDashboardScript(html: string): string {
  const match = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>\s*<\/html>\s*$/);
  if (!match) {
    throw new Error("Failed to resolve dashboard script for compact template.");
  }

  return match[1];
}

export const compactDashboardTemplateRenderer: DashboardTemplateRenderer = ({ dashboardName, basePath, setupDesign }) => {
  const script = extractDashboardScript(renderDefaultDashboardHtml(dashboardName, basePath, setupDesign));
  const safeName = escapeHtml(dashboardName);
  const body = renderCompactLayoutBody(safeName);

  return renderCompactLayoutDocument({
    safeName,
    css: compactAppCss,
    customCss: setupDesign?.customCss,
    body,
    script,
  });
};
