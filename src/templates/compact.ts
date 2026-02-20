import type { DashboardTemplateRenderer } from "../Types";
import { renderDashboardHtml } from "./templates";

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

const compactCss = `
:root {
  color-scheme: dark;
  --bg: #0f1221;
  --rail: #171a2d;
  --content-bg: #0f1426;
  --panel: #1f243b;
  --panel-2: #2a314e;
  --text: #f5f7ff;
  --muted: #aab1d6;
  --primary: #7c87ff;
  --success: #2bd4a6;
  --warning: #ffd166;
  --danger: #ff6f91;
  --info: #66d9ff;
  --border: rgba(255, 255, 255, 0.12);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  background: radial-gradient(circle at 0% 0%, #1b2140 0%, var(--bg) 45%);
  color: var(--text);
}
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}
.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: rgba(15, 20, 38, 0.7);
  backdrop-filter: blur(8px);
}
.brand { font-weight: 800; letter-spacing: .2px; }
.center-title { text-align: center; font-weight: 700; color: #d8defc; }
.pill {
  justify-self: end;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: .75rem;
}
.layout {
  display: grid;
  grid-template-columns: 80px 1fr;
  min-height: 0;
}
.sidebar {
  border-right: 1px solid var(--border);
  background: linear-gradient(180deg, var(--rail), #121528);
  padding: 10px 0;
}
.server-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.server-item {
  position: relative;
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 14px;
  overflow: visible;
  background: var(--panel);
  color: #fff;
  font-weight: 700;
  transition: transform .15s ease, background .15s ease;
}
.server-item:hover { transform: translateY(-1px); background: #323b5f; }
.server-item.active { background: var(--primary); transform: translateY(-2px); }
.server-item-indicator {
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%) scaleY(.5);
  width: 3px;
  height: 18px;
  background: #fff;
  border-radius: 999px;
  opacity: 0;
  transition: opacity .15s ease, transform .15s ease;
}
.server-item.active .server-item-indicator {
  opacity: 1;
  transform: translateY(-50%) scaleY(1);
}
.server-avatar { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.server-fallback { display: grid; place-items: center; width: 100%; height: 100%; }
.server-status {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 11px;
  height: 11px;
  border-radius: 999px;
  border: 2px solid var(--rail);
  background: #35d489;
}
.server-status.offline { background: #7f8bb3; }
.content {
  min-width: 0;
  padding: 12px;
}
.container {
  background: rgba(23, 28, 48, 0.6);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
}
.main-tabs { display: flex; gap: 8px; margin-bottom: 10px; }
button {
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 10px;
}
button.primary { background: var(--primary); border: none; }
button.danger { background: #4a2230; border-color: rgba(255,111,145,.45); }
.main-tab.active, .home-category-btn.active { background: var(--primary); border-color: transparent; }
.section-title { margin: 12px 0 8px; color: #dce3ff; font-size: .95rem; }
.grid { display: grid; gap: 10px; }
.cards { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.panel {
  background: linear-gradient(180deg, rgba(42,49,78,.7), rgba(31,36,59,.85));
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
}
.title { color: var(--muted); font-size: .83rem; }
.value { font-size: 1.25rem; font-weight: 800; margin-top: 5px; }
.subtitle { margin-top: 5px; color: var(--muted); font-size: .8rem; }
.home-categories { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.home-sections { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
.home-section-panel { flex: 0 0 100%; max-width: 100%; }
.home-width-50 { flex-basis: calc(50% - 5px); max-width: calc(50% - 5px); }
.home-width-33 { flex-basis: calc(33.333333% - 6.67px); max-width: calc(33.333333% - 6.67px); }
.home-width-20 { flex-basis: calc(20% - 8px); max-width: calc(20% - 8px); }
.home-fields, .plugin-fields { display: grid; gap: 8px; margin-top: 8px; }
.home-field, .plugin-field { display: grid; gap: 5px; }
.home-field label, .plugin-field > label { color: var(--muted); font-size: .8rem; }
.home-input, .home-textarea, .home-select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 7px 9px;
}
.home-textarea { min-height: 88px; resize: vertical; }
.home-checkbox { width: 17px; height: 17px; }
.home-field-row { display: flex; align-items: center; gap: 8px; }
.home-message { margin-top: 6px; color: var(--muted); font-size: .8rem; }
.lookup-wrap { position: relative; }
.lookup-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 5px);
  z-index: 20;
  border: 1px solid var(--border);
  background: #1f2742;
  border-radius: 8px;
  max-height: 220px;
  overflow: auto;
  display: none;
}
.lookup-item {
  width: 100%;
  border: none;
  border-radius: 0;
  text-align: left;
  padding: 8px 10px;
  background: transparent;
}
.lookup-item:hover { background: #2d3658; }
.lookup-selected { margin-top: 5px; font-size: .8rem; color: var(--muted); }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.kv-item {
  display: flex;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 9px;
  background: var(--panel-2);
}
.list-editor {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-2);
  padding: 8px;
  display: grid;
  gap: 8px;
}
.list-items { display: grid; gap: 6px; }
.list-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 8px;
  background: var(--panel);
}
.list-item.dragging { opacity: .6; }
.drag-handle { color: var(--muted); user-select: none; font-size: .9rem; }
.list-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text); }
.list-add { justify-self: start; }
.empty { color: var(--muted); font-size: .9rem; }
.cursor-pointer { cursor: pointer; }
@media (max-width: 980px) {
  .layout { grid-template-columns: 70px 1fr; }
  .home-width-50, .home-width-33, .home-width-20 { flex-basis: 100%; max-width: 100%; }
}
`;

export const compactDashboardTemplateRenderer: DashboardTemplateRenderer = ({ dashboardName, basePath, setupDesign }) => {
  const script = extractDashboardScript(renderDashboardHtml(dashboardName, basePath, setupDesign));
  const safeName = escapeHtml(dashboardName);

  const customCssBlock = setupDesign?.customCss ? `\n  <style>${setupDesign.customCss}</style>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>
  <style>${compactCss}</style>${customCssBlock}
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">${safeName}</div>
      <div id="centerTitle" class="center-title">User Dashboard</div>
      <div id="userMeta" class="pill">Loading...</div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div id="serverRail" class="server-rail"></div>
      </aside>

      <main class="content">
        <div class="container">
          <div class="main-tabs">
            <button id="tabHome" class="main-tab active cursor-pointer">Home</button>
            <button id="tabPlugins" class="main-tab cursor-pointer">Plugins</button>
          </div>

          <section id="homeArea">
            <div class="section-title">Home</div>
            <section id="homeCategories" class="home-categories"></section>
            <section id="homeSections" class="home-sections"></section>

            <section id="overviewArea">
              <div class="section-title">Dashboard Stats</div>
              <section id="overviewCards" class="grid cards"></section>
            </section>
          </section>

          <section id="pluginsArea" style="display:none;">
            <div class="section-title">Plugins</div>
            <section id="plugins" class="grid"></section>
          </section>
        </div>
      </main>
    </div>
  </div>

  <script>${script}</script>
</body>
</html>`;
};
