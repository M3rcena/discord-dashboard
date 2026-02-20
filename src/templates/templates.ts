import type { DashboardDesignConfig } from "../Types";

const appCss = `
:root {
  color-scheme: dark;
  --bg: #13151a;
  --rail: #1e1f24;
  --content-bg: #2b2d31;
  --panel: #313338;
  --panel-2: #3a3d43;
  --text: #eef2ff;
  --muted: #b5bac1;
  --primary: #5865f2;
  --success: #20c997;
  --warning: #f4c95d;
  --danger: #ff6b6b;
  --info: #4dabf7;
  --border: rgba(255, 255, 255, 0.12);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  width: 76px;
  background: var(--rail);
  padding: 12px 0;
  border-right: 1px solid var(--border);
}
.server-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.server-item {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: visible;
  border: none;
  padding: 0;
  background: var(--panel);
  color: #fff;
  font-weight: 700;
  display: grid;
  place-items: center;
  transition: border-radius .15s ease, background .15s ease, transform .15s ease;
}
.server-item:hover { border-radius: 16px; background: #404249; }
.server-item.active {
  border-radius: 16px;
  background: var(--primary);
  transform: scale(1.1);
}
.server-item-indicator {
  position: absolute;
  left: -9px;
  width: 4px;
  height: 20px;
  border-radius: 999px;
  background: #fff;
  opacity: 0;
  transform: scaleY(0.5);
  transition: opacity .15s ease, transform .15s ease, height .15s ease;
}
.server-item.active .server-item-indicator {
  opacity: 1;
  transform: scaleY(1);
  height: 28px;
}
.server-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  border-radius: inherit;
}
.server-fallback {
  font-weight: 700;
  font-size: 0.8rem;
}
.main-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.main-tab.active {
  background: var(--primary);
  border-color: transparent;
}
.server-status {
  position: absolute;
  right: -3px;
  bottom: -3px;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid var(--rail);
  background: #3ba55d;
  z-index: 2;
}
.server-status.offline {
  background: #747f8d;
}
.content {
  flex: 1;
  background: var(--content-bg);
  min-width: 0;
}
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
}
.brand {
  font-size: 1rem;
  font-weight: 700;
}
.center-title {
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
}
.topbar-right {
  justify-self: end;
}
.container {
  padding: 22px;
}
.grid {
  display: grid;
  gap: 16px;
}
.cards { grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
}
.title { color: var(--muted); font-size: 0.9rem; }
.value { font-size: 1.7rem; font-weight: 700; margin-top: 6px; }
.subtitle { margin-top: 8px; color: var(--muted); font-size: 0.88rem; }
.section-title { font-size: 1rem; margin: 20px 0 12px; color: #ffffff; }
.pill {
  padding: 4px 9px;
  border-radius: 999px;
  font-size: 0.76rem;
  border: 1px solid var(--border);
  color: var(--muted);
}
button {
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 12px;
}
button.primary {
  background: var(--primary);
  border: none;
}
button.danger { background: #3a1e27; border-color: rgba(255,107,107,.45); }
.actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
.home-categories {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.home-category-btn.active {
  background: var(--primary);
  border-color: transparent;
}
.home-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.home-section-panel {
  flex: 0 0 100%;
  max-width: 100%;
}
.home-width-50 {
  flex-basis: calc(50% - 6px);
  max-width: calc(50% - 6px);
}
.home-width-33 {
  flex-basis: calc(33.333333% - 8px);
  max-width: calc(33.333333% - 8px);
}
.home-width-20 {
  flex-basis: calc(20% - 9.6px);
  max-width: calc(20% - 9.6px);
}
@media (max-width: 980px) {
  .home-width-50,
  .home-width-33,
  .home-width-20 {
    flex-basis: 100%;
    max-width: 100%;
  }
}
.home-fields { display: grid; gap: 10px; margin-top: 10px; }
.home-field { display: grid; gap: 6px; }
.home-field label { color: var(--muted); font-size: 0.84rem; }
.lookup-wrap { position: relative; }
.home-input,
.home-textarea,
.home-select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--panel-2);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 10px;
}
.home-textarea { min-height: 92px; resize: vertical; }
.home-checkbox {
  width: 18px;
  height: 18px;
}
.home-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.home-message {
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.84rem;
}
.lookup-results {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 20;
  border: 1px solid var(--border);
  background: var(--panel);
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
.lookup-item:hover {
  background: var(--panel-2);
}
.lookup-selected {
  margin-top: 6px;
  font-size: 0.82rem;
  color: var(--muted);
}
.kv { display: grid; gap: 8px; margin-top: 10px; }
.kv-item {
  display: flex;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--panel-2);
}
.plugin-fields {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}
.plugin-field {
  display: grid;
  gap: 6px;
}
.plugin-field > label {
  color: var(--muted);
  font-size: 0.84rem;
}
.list-editor {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel-2);
  padding: 8px;
  display: grid;
  gap: 8px;
}
.list-items {
  display: grid;
  gap: 6px;
}
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
.list-item.dragging {
  opacity: .6;
}
.drag-handle {
  color: var(--muted);
  user-select: none;
  font-size: 0.9rem;
}
.list-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text);
}
.list-add {
  justify-self: start;
}
.empty { color: var(--muted); font-size: 0.9rem; }
.cursor-pointer { cursor: pointer; }
`;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderDashboardHtml(name: string, basePath: string, setupDesign?: DashboardDesignConfig): string {
  const safeName = escapeHtml(name);
  const scriptData = JSON.stringify({ basePath, setupDesign: setupDesign ?? {} });

  const customCssBlock = setupDesign?.customCss ? `\n  <style>${setupDesign.customCss}</style>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>
  <style>${appCss}</style>${customCssBlock}
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div id="serverRail" class="server-rail"></div>
    </aside>

    <main class="content">
      <header class="topbar">
        <div class="brand">${safeName}</div>
        <div id="centerTitle" class="center-title">User Dashboard</div>
        <div id="userMeta" class="pill topbar-right">Loading...</div>
      </header>

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

  <script>
    const dashboardConfig = ${scriptData};
    const state = {
      session: null,
      guilds: [],
      selectedGuildId: null,
      homeCategories: [],
      selectedHomeCategoryId: null,
      activeMainTab: "home"
    };

    const el = {
      serverRail: document.getElementById("serverRail"),
      userMeta: document.getElementById("userMeta"),
      centerTitle: document.getElementById("centerTitle"),
      tabHome: document.getElementById("tabHome"),
      tabPlugins: document.getElementById("tabPlugins"),
      homeArea: document.getElementById("homeArea"),
      pluginsArea: document.getElementById("pluginsArea"),
      homeCategories: document.getElementById("homeCategories"),
      homeSections: document.getElementById("homeSections"),
      overviewArea: document.getElementById("overviewArea"),
      overviewCards: document.getElementById("overviewCards"),
      plugins: document.getElementById("plugins")
    };

    const fetchJson = async (url, init) => {
      const response = await fetch(url, init);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    };

    const buildApiUrl = (path) => {
      if (!state.selectedGuildId) {
        return dashboardConfig.basePath + path;
      }

      const separator = path.includes("?") ? "&" : "?";
      return dashboardConfig.basePath + path + separator + "guildId=" + encodeURIComponent(state.selectedGuildId);
    };

    const escapeHtml = (value) => String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

    const normalizeBoxWidth = (value) => {
      const numeric = Number(value);
      if (numeric === 50 || numeric === 33 || numeric === 20) {
        return numeric;
      }

      return 100;
    };

    const applySetupDesign = () => {
      const root = document.documentElement;
      const design = dashboardConfig.setupDesign || {};
      const mappings = {
        bg: "--bg",
        rail: "--rail",
        contentBg: "--content-bg",
        panel: "--panel",
        panel2: "--panel-2",
        text: "--text",
        muted: "--muted",
        primary: "--primary",
        success: "--success",
        warning: "--warning",
        danger: "--danger",
        info: "--info",
        border: "--border"
      };

      Object.entries(mappings).forEach(([key, cssVar]) => {
        const value = design[key];
        if (typeof value === "string" && value.trim().length > 0) {
          root.style.setProperty(cssVar, value.trim());
        }
      });
    };

    const makeButton = (action, pluginId, panelId, panelElement) => {
      const button = document.createElement("button");
      button.textContent = action.label;
      const variantClass = action.variant === "primary" ? "primary" : action.variant === "danger" ? "danger" : "";
      button.className = [variantClass, "cursor-pointer"].filter(Boolean).join(" ");
      
      button.addEventListener("click", async () => {
        button.disabled = true;
        try {
          let payload = {};
          if (action.collectFields && panelElement) {
            const values = {};
            const inputs = panelElement.querySelectorAll("[data-plugin-field-id]");
            inputs.forEach((inputEl) => {
              const fieldId = inputEl.dataset.pluginFieldId;
              const fieldType = inputEl.dataset.pluginFieldType || "text";
              if (!fieldId) {
                return;
              }

              values[fieldId] = toFieldValue({ type: fieldType }, inputEl);
            });
            payload = {
              panelId,
              values
            };
          }

          const actionUrl = buildApiUrl("/api/plugins/" + encodeURIComponent(pluginId) + "/" + encodeURIComponent(action.id));
          const result = await fetchJson(actionUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          if (result.message) {
            alert(result.message);
          }
          if (result.refresh) {
            await refreshContent();
          }
        } catch (error) {
          alert(error instanceof Error ? error.message : "Action failed");
        } finally {
          button.disabled = false;
        }
      });
      return button;
    };

    const renderCards = (cards) => {
      if (!cards.length) {
        el.overviewCards.innerHTML = '<div class="empty">No cards configured yet.</div>';
        return;
      }

      el.overviewCards.innerHTML = cards.map((card) => {
        const subtitle = card.subtitle ? '<div class="subtitle">' + escapeHtml(card.subtitle) + '</div>' : "";
        return '<article class="panel">'
          + '<div class="title">' + escapeHtml(card.title) + '</div>'
          + '<div class="value">' + escapeHtml(card.value) + '</div>'
          + subtitle
          + '</article>';
      }).join("");
    };

    const shortName = (name) => {
      if (!name) return "?";
      const parts = String(name).trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const addAvatarOrFallback = (button, item) => {
      if (!item.avatarUrl) {
        const fallback = document.createElement("span");
        fallback.className = "server-fallback";
        fallback.textContent = item.short;
        button.appendChild(fallback);
        return;
      }

      const avatar = document.createElement("img");
      avatar.className = "server-avatar";
      avatar.src = item.avatarUrl;
      avatar.alt = item.name;
      avatar.addEventListener("error", () => {
        avatar.remove();
        const fallback = document.createElement("span");
        fallback.className = "server-fallback";
        fallback.textContent = item.short;
        button.appendChild(fallback);
      });
      button.appendChild(avatar);
    };

    const renderServerRail = () => {
      const items = [{ id: null, name: "User Dashboard", short: "ME", avatarUrl: state.session?.user?.avatarUrl ?? null, botInGuild: true }].concat(
        state.guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          short: shortName(guild.name),
          avatarUrl: guild.iconUrl ?? null,
          botInGuild: guild.botInGuild !== false,
          inviteUrl: guild.inviteUrl
        }))
      );

      el.serverRail.innerHTML = "";
      items.forEach((item) => {
        const button = document.createElement("button");
        button.className = "server-item cursor-pointer" + (item.id === state.selectedGuildId ? " active" : "");
        button.title = item.id && !item.botInGuild ? (item.name + " • Invite bot") : item.name;

        const activeIndicator = document.createElement("span");
        activeIndicator.className = "server-item-indicator";
        button.appendChild(activeIndicator);

        addAvatarOrFallback(button, item);

        if (item.id) {
          const status = document.createElement("span");
          status.className = "server-status" + (item.botInGuild ? "" : " offline");
          button.appendChild(status);
        }

        button.addEventListener("click", async () => {
          if (item.id && !item.botInGuild && item.inviteUrl) {
            const opened = window.open(item.inviteUrl, "_blank", "noopener,noreferrer");
            if (!opened && typeof alert === "function") {
              alert("Popup blocked. Please allow popups to open the invite page.");
            }
            return;
          }

          state.selectedGuildId = item.id;
          renderServerRail();
          updateContextLabel();
          await refreshContent();
        });
        el.serverRail.appendChild(button);
      });
    };

    const applyMainTab = () => {
      const homeActive = state.activeMainTab === "home";
      el.homeArea.style.display = homeActive ? "block" : "none";
      el.pluginsArea.style.display = homeActive ? "none" : "block";
      el.tabHome.className = "main-tab cursor-pointer" + (homeActive ? " active" : "");
      el.tabPlugins.className = "main-tab cursor-pointer" + (!homeActive ? " active" : "");
    };

    const updateContextLabel = () => {
      if (!state.selectedGuildId) {
        el.centerTitle.textContent = "User Dashboard";
        return;
      }

      const selectedGuild = state.guilds.find((guild) => guild.id === state.selectedGuildId);
      el.centerTitle.textContent = selectedGuild ? (selectedGuild.name + " Dashboard") : "Server Dashboard";
    };

    const renderHomeCategories = () => {
      if (!state.homeCategories.length) {
        el.homeCategories.innerHTML = "";
        return;
      }

      el.homeCategories.innerHTML = "";
      state.homeCategories.forEach((category) => {
        const button = document.createElement("button");
        button.className = "home-category-btn cursor-pointer" + (state.selectedHomeCategoryId === category.id ? " active" : "");
        button.textContent = category.label;
        button.title = category.description || category.label;
        button.addEventListener("click", async () => {
          state.selectedHomeCategoryId = category.id;
          renderHomeCategories();
          await refreshContent();
        });
        el.homeCategories.appendChild(button);
      });
    };

    const toFieldValue = (field, element) => {
      if (field.type === "string-list") {
        const raw = element.dataset.listValues;
        if (!raw) {
          return [];
        }

        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      if (field.type === "role-search" || field.type === "channel-search" || field.type === "member-search") {
        const raw = element.dataset.selectedObject;
        if (!raw) {
          return null;
        }

        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }

      if (field.type === "boolean") {
        return Boolean(element.checked);
      }

      if (field.type === "number") {
        if (element.value === "") {
          return null;
        }
        return Number(element.value);
      }

      return element.value;
    };

    const setupStringListField = (field, input, fieldWrap) => {
      const editor = document.createElement("div");
      editor.className = "list-editor";
      const itemsWrap = document.createElement("div");
      itemsWrap.className = "list-items";
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "list-add cursor-pointer";
      addButton.textContent = "Add Button";

      const normalizeValues = () => {
        const values = Array.from(itemsWrap.querySelectorAll(".list-input"))
          .map((item) => item.value.trim())
          .filter((item) => item.length > 0);
        input.dataset.listValues = JSON.stringify(values);
      };

      const makeRow = (value = "") => {
        const row = document.createElement("div");
        row.className = "list-item";
        row.draggable = true;

        const handle = document.createElement("span");
        handle.className = "drag-handle cursor-pointer";
        handle.textContent = "⋮⋮";

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "list-input";
        textInput.value = value;
        textInput.placeholder = "Button label";
        textInput.addEventListener("input", normalizeValues);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "cursor-pointer";
        removeButton.textContent = "×";
        removeButton.addEventListener("click", () => {
          row.remove();
          normalizeValues();
        });

        row.addEventListener("dragstart", () => {
          row.classList.add("dragging");
        });
        row.addEventListener("dragend", () => {
          row.classList.remove("dragging");
          normalizeValues();
        });

        row.appendChild(handle);
        row.appendChild(textInput);
        row.appendChild(removeButton);
        return row;
      };

      itemsWrap.addEventListener("dragover", (event) => {
        event.preventDefault();
        const dragging = itemsWrap.querySelector(".dragging");
        if (!dragging) {
          return;
        }

        const siblings = Array.from(itemsWrap.querySelectorAll(".list-item:not(.dragging)"));
        let inserted = false;

        for (const sibling of siblings) {
          const rect = sibling.getBoundingClientRect();
          if (event.clientY < rect.top + rect.height / 2) {
            itemsWrap.insertBefore(dragging, sibling);
            inserted = true;
            break;
          }
        }

        if (!inserted) {
          itemsWrap.appendChild(dragging);
        }
      });

      const initialValues = Array.isArray(field.value)
        ? field.value.map((item) => String(item))
        : [];
      if (initialValues.length === 0) {
        initialValues.push("Yes", "No");
      }

      initialValues.forEach((value) => {
        itemsWrap.appendChild(makeRow(value));
      });

      addButton.addEventListener("click", () => {
        itemsWrap.appendChild(makeRow(""));
        normalizeValues();
      });

      editor.appendChild(itemsWrap);
      editor.appendChild(addButton);
      fieldWrap.appendChild(editor);
      normalizeValues();
    };

    const showLookupResults = (container, items, labelResolver, onSelect) => {
      container.innerHTML = "";

      if (!items.length) {
        container.style.display = "none";
        return;
      }

      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "lookup-item cursor-pointer";
        btn.textContent = labelResolver(item);
        btn.addEventListener("click", () => {
          onSelect(item);
          container.style.display = "none";
        });
        container.appendChild(btn);
      });

      container.style.display = "block";
    };

    const setupLookupField = (field, input, fieldWrap) => {
      const wrap = document.createElement("div");
      wrap.className = "lookup-wrap";
      const results = document.createElement("div");
      results.className = "lookup-results";
      const selected = document.createElement("div");
      selected.className = "lookup-selected";
      selected.textContent = "No selection";

      wrap.appendChild(input);
      wrap.appendChild(results);
      fieldWrap.appendChild(wrap);
      fieldWrap.appendChild(selected);

      const minQueryLength = Math.max(0, field.lookup?.minQueryLength ?? 1);
      const limit = Math.max(1, Math.min(field.lookup?.limit ?? 10, 50));

      const runSearch = async () => {
        const query = String(input.value || "");
        if (query.length < minQueryLength) {
          results.style.display = "none";
          return;
        }

        try {
          if (field.type === "role-search") {
            const params = new URLSearchParams({ q: query, limit: String(limit) });
            if (field.lookup?.includeManaged !== undefined) {
              params.set("includeManaged", String(Boolean(field.lookup.includeManaged)));
            }

            const payload = await fetchJson(buildApiUrl("/api/lookup/roles?" + params.toString()));
            showLookupResults(
              results,
              payload.roles || [],
              (item) => "@" + item.name,
              (item) => {
                input.value = item.name;
                input.dataset.selectedObject = JSON.stringify(item);
                selected.textContent = "Selected role: @" + item.name + " (" + item.id + ")";
              }
            );
          } else if (field.type === "channel-search") {
            const params = new URLSearchParams({ q: query, limit: String(limit) });
            if (field.lookup?.nsfw !== undefined) {
              params.set("nsfw", String(Boolean(field.lookup.nsfw)));
            }
            if (field.lookup?.channelTypes && field.lookup.channelTypes.length > 0) {
              params.set("channelTypes", field.lookup.channelTypes.join(","));
            }

            const payload = await fetchJson(buildApiUrl("/api/lookup/channels?" + params.toString()));
            showLookupResults(
              results,
              payload.channels || [],
              (item) => "#" + item.name,
              (item) => {
                input.value = item.name;
                input.dataset.selectedObject = JSON.stringify(item);
                selected.textContent = "Selected channel: #" + item.name + " (" + item.id + ")";
              }
            );
          } else if (field.type === "member-search") {
            const params = new URLSearchParams({ q: query, limit: String(limit) });
            const payload = await fetchJson(buildApiUrl("/api/lookup/members?" + params.toString()));
            showLookupResults(
              results,
              payload.members || [],
              (item) => {
                const username = item?.user?.username || "unknown";
                const nick = item?.nick ? " (" + item.nick + ")" : "";
                return username + nick;
              },
              (item) => {
                const username = item?.user?.username || "unknown";
                input.value = username;
                input.dataset.selectedObject = JSON.stringify(item);
                selected.textContent = "Selected member: " + username + " (" + (item?.user?.id || "unknown") + ")";
              }
            );
          }
        } catch {
          results.style.display = "none";
        }
      };

      input.addEventListener("input", () => {
        input.dataset.selectedObject = "";
        selected.textContent = "No selection";
        runSearch();
      });

      input.addEventListener("blur", () => {
        setTimeout(() => {
          results.style.display = "none";
        }, 120);
      });
    };

    const renderHomeSections = (sections) => {
      if (!sections.length) {
        el.homeSections.innerHTML = '<div class="empty">No home sections configured.</div>';
        return;
      }

      el.homeSections.innerHTML = "";
      sections.forEach((section) => {
        const wrap = document.createElement("article");
        wrap.className = "panel home-section-panel home-width-" + normalizeBoxWidth(section.width);

        const heading = document.createElement("h3");
        heading.textContent = section.title;
        heading.style.margin = "0";
        wrap.appendChild(heading);

        if (section.description) {
          const desc = document.createElement("div");
          desc.className = "subtitle";
          desc.textContent = section.description;
          wrap.appendChild(desc);
        }

        const message = document.createElement("div");
        message.className = "home-message";

        if (section.fields?.length) {
          const fieldsWrap = document.createElement("div");
          fieldsWrap.className = "home-fields";

          section.fields.forEach((field) => {
            const fieldWrap = document.createElement("div");
            fieldWrap.className = "home-field";

            const label = document.createElement("label");
            label.textContent = field.label;
            fieldWrap.appendChild(label);

            let input;
            if (field.type === "textarea") {
              input = document.createElement("textarea");
              input.className = "home-textarea";
              input.value = field.value == null ? "" : String(field.value);
            } else if (field.type === "select") {
              input = document.createElement("select");
              input.className = "home-select cursor-pointer";
              (field.options || []).forEach((option) => {
                const optionEl = document.createElement("option");
                optionEl.value = option.value;
                optionEl.textContent = option.label;
                if (String(field.value ?? "") === option.value) {
                  optionEl.selected = true;
                }
                input.appendChild(optionEl);
              });
            } else if (field.type === "boolean") {
              const row = document.createElement("div");
              row.className = "home-field-row";
              input = document.createElement("input");
              input.type = "checkbox";
              input.className = "home-checkbox cursor-pointer";
              input.checked = Boolean(field.value);
              const stateText = document.createElement("span");
              stateText.textContent = input.checked ? "Enabled" : "Disabled";
              input.addEventListener("change", () => {
                stateText.textContent = input.checked ? "Enabled" : "Disabled";
              });
              row.appendChild(input);
              row.appendChild(stateText);
              fieldWrap.appendChild(row);
            } else {
              input = document.createElement("input");
              input.className = "home-input";
              input.type = field.type === "number" ? "number" : "text";
              input.value = field.value == null ? "" : String(field.value);
            }

            if (input) {
              input.dataset.homeFieldId = field.id;
              input.dataset.homeFieldType = field.type;
              if (field.placeholder && "placeholder" in input) {
                input.placeholder = field.placeholder;
              }
              if (field.required && "required" in input) {
                input.required = true;
              }
              if (field.readOnly) {
                if ("readOnly" in input) {
                  input.readOnly = true;
                }
                if ("disabled" in input) {
                  input.disabled = true;
                }
              }

              if (field.type === "role-search" || field.type === "channel-search" || field.type === "member-search") {
                setupLookupField(field, input, fieldWrap);
              } else if (field.type !== "boolean") {
                fieldWrap.appendChild(input);
              }
            }

            fieldsWrap.appendChild(fieldWrap);
          });

          wrap.appendChild(fieldsWrap);
        }

        if (section.actions?.length) {
          const actions = document.createElement("div");
          actions.className = "actions";

          section.actions.forEach((action) => {
            const button = document.createElement("button");
            button.textContent = action.label;
            const variantClass = action.variant === "primary" ? "primary" : action.variant === "danger" ? "danger" : "";
            button.className = [variantClass, "cursor-pointer"].filter(Boolean).join(" ");
            
            button.addEventListener("click", async () => {
              button.disabled = true;
              try {
                const values = {};
                const inputs = wrap.querySelectorAll("[data-home-field-id]");
                inputs.forEach((inputEl) => {
                  const fieldId = inputEl.dataset.homeFieldId;
                  const fieldType = inputEl.dataset.homeFieldType || "text";
                  if (!fieldId) {
                    return;
                  }

                  values[fieldId] = toFieldValue({ type: fieldType }, inputEl);
                });

                const result = await fetchJson(buildApiUrl("/api/home/" + encodeURIComponent(action.id)), {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    sectionId: section.id,
                    values
                  })
                });

                message.textContent = result.message || "Saved.";
                if (result.refresh) {
                  await refreshContent();
                }
              } catch (error) {
                message.textContent = error instanceof Error ? error.message : "Save failed";
              } finally {
                button.disabled = false;
              }
            });
            actions.appendChild(button);
          });

          wrap.appendChild(actions);
        }

        wrap.appendChild(message);
        el.homeSections.appendChild(wrap);
      });
    };

    const renderPlugins = (plugins) => {
      if (!plugins.length) {
        el.plugins.innerHTML = '<div class="empty">No plugins configured yet.</div>';
        return;
      }

      el.plugins.innerHTML = "";
      plugins.forEach((plugin) => {
        const wrap = document.createElement("article");
        wrap.className = "panel";

        const heading = document.createElement("div");
        heading.className = "title";
        heading.textContent = plugin.name;
        wrap.appendChild(heading);

        if (plugin.description) {
          const desc = document.createElement("div");
          desc.className = "subtitle";
          desc.textContent = plugin.description;
          wrap.appendChild(desc);
        }

        (plugin.panels || []).forEach((panel) => {
          const panelBody = document.createElement("div");

          const panelTitle = document.createElement("h4");
          panelTitle.textContent = panel.title;
          panelTitle.style.marginBottom = "4px";
          panelBody.appendChild(panelTitle);

          if (panel.description) {
            const p = document.createElement("div");
            p.className = "subtitle";
            p.textContent = panel.description;
            panelBody.appendChild(p);
          }

          if (panel.fields?.length) {
            const fieldsWrap = document.createElement("div");
            fieldsWrap.className = "plugin-fields";

            panel.fields.forEach((field) => {
              const fieldWrap = document.createElement("div");
              fieldWrap.className = field.editable ? "plugin-field" : "kv-item";

              if (!field.editable) {
                const display = field.value == null
                  ? ""
                  : typeof field.value === "object"
                    ? JSON.stringify(field.value)
                    : String(field.value);
                fieldWrap.innerHTML = '<strong>' + escapeHtml(field.label) + '</strong><span>' + escapeHtml(display) + '</span>';
                fieldsWrap.appendChild(fieldWrap);
                return;
              }

              const label = document.createElement("label");
              label.textContent = field.label;
              fieldWrap.appendChild(label);

              let input;
              if (field.type === "textarea") {
                input = document.createElement("textarea");
                input.className = "home-textarea";
                input.value = field.value == null ? "" : String(field.value);
              } else if (field.type === "select") {
                input = document.createElement("select");
                input.className = "home-select cursor-pointer";
                (field.options || []).forEach((option) => {
                  const optionEl = document.createElement("option");
                  optionEl.value = option.value;
                  optionEl.textContent = option.label;
                  if (String(field.value ?? "") === option.value) {
                    optionEl.selected = true;
                  }
                  input.appendChild(optionEl);
                });
              } else if (field.type === "boolean") {
                const row = document.createElement("div");
                row.className = "home-field-row";
                input = document.createElement("input");
                input.type = "checkbox";
                input.className = "home-checkbox cursor-pointer";
                input.checked = Boolean(field.value);
                const stateText = document.createElement("span");
                stateText.textContent = input.checked ? "Enabled" : "Disabled";
                input.addEventListener("change", () => {
                  stateText.textContent = input.checked ? "Enabled" : "Disabled";
                });
                row.appendChild(input);
                row.appendChild(stateText);
                fieldWrap.appendChild(row);
              } else {
                input = document.createElement("input");
                input.className = "home-input";
                input.type = field.type === "number" ? "number" : field.type === "url" ? "url" : "text";
                input.value = field.value == null ? "" : String(field.value);
              }

              if (input) {
                input.dataset.pluginFieldId = field.id || field.label;
                input.dataset.pluginFieldType = field.type || "text";
                if (field.placeholder && "placeholder" in input) {
                  input.placeholder = field.placeholder;
                }
                if (field.required && "required" in input) {
                  input.required = true;
                }

                const isLookup = field.type === "role-search" || field.type === "channel-search" || field.type === "member-search";
                if (isLookup) {
                  setupLookupField(field, input, fieldWrap);
                } else if (field.type === "string-list") {
                  setupStringListField(field, input, fieldWrap);
                } else if (field.type !== "boolean") {
                  fieldWrap.appendChild(input);
                }
              }

              fieldsWrap.appendChild(fieldWrap);
            });
            panelBody.appendChild(fieldsWrap);
          }

          if (panel.actions?.length) {
            const actions = document.createElement("div");
            actions.className = "actions";
            panel.actions.forEach((action) => {
              actions.appendChild(makeButton(action, plugin.id, panel.id, panelBody));
            });
            panelBody.appendChild(actions);
          }

          wrap.appendChild(panelBody);
        });

        el.plugins.appendChild(wrap);
      });
    };

    const refreshContent = async () => {
      const categoriesPayload = await fetchJson(buildApiUrl("/api/home/categories"));
      state.homeCategories = categoriesPayload.categories || [];
      if (!state.selectedHomeCategoryId || !state.homeCategories.some((item) => item.id === state.selectedHomeCategoryId)) {
        const overviewCategory = state.homeCategories.find((item) => item.id === "overview");
        state.selectedHomeCategoryId = overviewCategory ? overviewCategory.id : (state.homeCategories[0]?.id ?? null);
      }
      renderHomeCategories();

      const homePath = state.selectedHomeCategoryId
        ? "/api/home?categoryId=" + encodeURIComponent(state.selectedHomeCategoryId)
        : "/api/home";

      const [home, overview, plugins] = await Promise.all([
        fetchJson(buildApiUrl(homePath)),
        fetchJson(buildApiUrl("/api/overview")),
        fetchJson(buildApiUrl("/api/plugins"))
      ]);

      renderHomeSections(home.sections || []);
      const showOverviewArea = state.selectedHomeCategoryId === "overview";
      el.overviewArea.style.display = showOverviewArea ? "block" : "none";
      renderCards(overview.cards || []);
      renderPlugins(plugins.plugins || []);
    };

    const loadInitialData = async () => {
      applySetupDesign();

      const session = await fetchJson(dashboardConfig.basePath + "/api/session");
      if (!session.authenticated) {
        window.location.href = dashboardConfig.basePath + "/login";
        return;
      }

      state.session = session;
      el.userMeta.textContent = session.user.username + " • " + session.guildCount + " guild(s)";
      const guilds = await fetchJson(dashboardConfig.basePath + "/api/guilds");
      state.guilds = guilds.guilds || [];
      state.selectedGuildId = null;
      renderServerRail();
      updateContextLabel();

      el.tabHome.addEventListener("click", () => {
        state.activeMainTab = "home";
        applyMainTab();
      });

      el.tabPlugins.addEventListener("click", () => {
        state.activeMainTab = "plugins";
        applyMainTab();
      });

      applyMainTab();
      await refreshContent();
    };

    loadInitialData().catch((error) => {
      el.userMeta.textContent = "Load failed";
      console.error(error);
    });
  </script>
</body>
</html>`;
}
