export const shadcnMagicAppCss = `
:root {
  color-scheme: dark;
  --bg: #06070b;
  --surface: rgba(10, 12, 18, 0.84);
  --card: rgba(16, 20, 30, 0.82);
  --card-2: rgba(23, 29, 42, 0.86);
  --text: #f8fafc;
  --muted: #94a3b8;
  --primary: #c084fc;
  --accent: #22d3ee;
  --border: rgba(148, 163, 184, 0.26);
  --radius-lg: 18px;
  --radius-md: 12px;
}

* { box-sizing: border-box; }

html, body { min-height: 100%; }

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  color: var(--text);
  background:
    radial-gradient(circle at 8% 12%, rgba(192,132,252,.22), transparent 34%),
    radial-gradient(circle at 92% 8%, rgba(34,211,238,.18), transparent 36%),
    radial-gradient(circle at 76% 86%, rgba(244,114,182,.14), transparent 34%),
    var(--bg);
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148,163,184,.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148,163,184,.06) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(circle at center, rgba(0,0,0,.9), transparent 72%);
}

.page {
  min-height: 100vh;
  width: 100%;
  padding: 0;
}

.shell {
  border: 1px solid var(--border);
  border-radius: 0;
  background: linear-gradient(180deg, rgba(8, 10, 14, .78), rgba(6, 8, 12, .72));
  backdrop-filter: blur(10px);
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(6, 8, 12, .66);
}

.brand {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: .2px;
}

.center-title {
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, .44);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: .82rem;
  color: #e2e8f0;
}

.pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: .78rem;
  color: var(--muted);
  background: rgba(15, 23, 42, .52);
}

.server-strip {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(8, 12, 18, .48);
}

.server-rail {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.server-item {
  position: relative;
  min-width: 210px;
  height: 60px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(30, 41, 59, .74), rgba(15, 23, 42, .7));
  color: var(--text);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 8px 72px 8px 56px;
  transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease;
}

.server-item::before {
  content: attr(title);
  display: block;
  max-width: 100%;
  font-size: .82rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: .1px;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-item:hover {
  transform: translateY(-2px);
  border-color: rgba(192,132,252,.72);
}

.server-item.active {
  border-color: rgba(34,211,238,.86);
  box-shadow: 0 0 0 1px rgba(34,211,238,.3), 0 10px 26px rgba(34,211,238,.17);
}

.server-item-indicator {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 0;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--primary), var(--accent));
  opacity: 0;
  transition: opacity .15s ease, height .15s ease;
}

.server-item.active .server-item-indicator {
  opacity: 1;
  height: 32px;
}

.server-avatar {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 8px;
  object-fit: cover;
}

.server-fallback {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(148,163,184,.18);
  font-size: .75rem;
}

.server-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #22c55e;
}

.server-status::after {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: .7rem;
  font-weight: 500;
  letter-spacing: .15px;
  color: #86efac;
  white-space: nowrap;
}

.server-status.offline {
  background: #94a3b8;
}

.server-status.offline::after {
  content: "Invite Bot";
  color: #fda4af;
}

.content {
  padding: 16px;
}

.container {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  padding: 14px;
}

.main-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 5px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(15, 23, 42, .4);
  margin-bottom: 14px;
}

button {
  border: 1px solid var(--border);
  background: var(--card-2);
  color: var(--text);
  border-radius: 999px;
  padding: 7px 13px;
}

button.primary {
  border: none;
  color: #0b1020;
  font-weight: 700;
  background: linear-gradient(90deg, rgba(192,132,252,.95), rgba(34,211,238,.95));
}

button.danger {
  background: rgba(190,24,93,.2);
  border-color: rgba(244,114,182,.45);
}

.main-tab.active,
.home-category-btn.active {
  background: rgba(34,211,238,.2);
  border-color: rgba(34,211,238,.62);
}

.section-title {
  margin: 10px 0 9px;
  font-size: .92rem;
  color: #e2e8f0;
  letter-spacing: .15px;
}

.grid { display: grid; gap: 10px; }
.cards { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }

.panel {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--card);
  padding: 12px;
}

.title { color: var(--muted); font-size: .82rem; }
.value { margin-top: 6px; font-size: 1.34rem; font-weight: 700; }
.subtitle { margin-top: 6px; color: var(--muted); font-size: .8rem; }

.home-categories,
.home-sections {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.home-section-panel { flex: 0 0 100%; max-width: 100%; }
.home-width-50 { flex-basis: calc(50% - 5px); max-width: calc(50% - 5px); }
.home-width-33 { flex-basis: calc(33.333333% - 6.67px); max-width: calc(33.333333% - 6.67px); }
.home-width-20 { flex-basis: calc(20% - 8px); max-width: calc(20% - 8px); }

.home-fields,
.plugin-fields { display: grid; gap: 9px; margin-top: 8px; }
.home-field,
.plugin-field { display: grid; gap: 5px; }
.home-field label,
.plugin-field > label { color: var(--muted); font-size: .8rem; }

.home-input,
.home-textarea,
.home-select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--card-2);
  color: var(--text);
  border-radius: 10px;
  padding: 8px 10px;
}

.home-textarea { min-height: 90px; resize: vertical; }
.home-checkbox { width: 17px; height: 17px; }
.home-field-row { display: flex; align-items: center; gap: 8px; }
.home-message { margin-top: 6px; color: var(--muted); font-size: .8rem; }

.lookup-wrap { position: relative; }
.lookup-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  border: 1px solid var(--border);
  background: rgba(15, 23, 42, .96);
  border-radius: 10px;
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

.lookup-item:hover { background: rgba(51,65,85,.56); }
.lookup-selected { margin-top: 5px; font-size: .8rem; color: var(--muted); }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

.kv-item {
  display: flex;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 7px 10px;
  background: var(--card-2);
}

.list-editor {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--card-2);
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
  background: rgba(23, 29, 42, .78);
}

.list-item.dragging { opacity: .6; }
.drag-handle { color: var(--muted); user-select: none; font-size: .9rem; }
.list-input { width: 100%; border: none; outline: none; background: transparent; color: var(--text); }
.list-add { justify-self: start; }
.empty { color: var(--muted); font-size: .9rem; }
.cursor-pointer { cursor: pointer; }

@media (max-width: 980px) {
  .topbar { grid-template-columns: 1fr auto; }
  .center-title { display: none; }
  .server-item { min-width: 180px; }
  .home-width-50,
  .home-width-33,
  .home-width-20 { flex-basis: 100%; max-width: 100%; }
}
`;

export function renderShadcnMagicLayoutBody(safeName: string): string {
  return `<div class="page">
    <div class="shell">
      <header class="topbar">
        <div class="brand">${safeName}</div>
        <div id="centerTitle" class="center-title">Workspace Hub</div>
        <div id="userMeta" class="pill">Loading...</div>
      </header>

      <section class="server-strip">
        <div id="serverRail" class="server-rail"></div>
      </section>

      <main class="content">
        <section class="container">
          <div class="main-tabs">
            <button id="tabHome" class="main-tab active cursor-pointer">Home</button>
            <button id="tabPlugins" class="main-tab cursor-pointer">Plugins</button>
          </div>

          <section id="homeArea">
            <div class="section-title">Dashboard Workspace</div>
            <section id="homeCategories" class="home-categories"></section>
            <section id="homeSections" class="home-sections"></section>

            <section id="overviewArea">
              <div class="section-title">Overview Metrics</div>
              <section id="overviewCards" class="grid cards"></section>
            </section>
          </section>

          <section id="pluginsArea" style="display:none;">
            <div class="section-title">Plugin Center</div>
            <section id="plugins" class="grid"></section>
          </section>
        </section>
      </main>
    </div>
  </div>`;
}

export function renderShadcnMagicLayoutDocument(input: {
  safeName: string;
  css: string;
  customCss?: string;
  body: string;
  script: string;
}): string {
  const customCssBlock = input.customCss ? `\n  <style>${input.customCss}</style>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${input.safeName}</title>
  <style>${input.css}</style>${customCssBlock}
</head>
<body>
  ${input.body}

  <script>${input.script}</script>
</body>
</html>`;
}
