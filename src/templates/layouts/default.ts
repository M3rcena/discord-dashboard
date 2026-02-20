import type { DashboardTemplateRenderContext } from "../../Types";

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function renderDefaultLayout(context: DashboardTemplateRenderContext): string {
  const safeName = escapeHtml(context.dashboardName);
  const design = context.setupDesign ?? {};
  const scriptData = JSON.stringify({ basePath: context.basePath });

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeName}</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: ${design.bg ?? "#08090f"};
        --content-bg: ${design.contentBg ?? "radial-gradient(circle at top right, #171a2f, #08090f)"};
        --panel: ${design.panel ?? "rgba(20, 23, 43, 0.5)"};
        --panel-2: ${design.panel2 ?? "rgba(0, 0, 0, 0.4)"};
        --text: ${design.text ?? "#e0e6ff"};
        --muted: ${design.muted ?? "#8a93bc"};
        --primary: ${design.primary ?? "#5865F2"};
        --primary-glow: rgba(88, 101, 242, 0.4);
        --success: ${design.success ?? "#00E676"};
        --danger: ${design.danger ?? "#FF3D00"};
        --border: ${design.border ?? "rgba(255, 255, 255, 0.05)"};
      }
      
      * { box-sizing: border-box; }
      
      body {
        margin: 0;
        padding: 24px; /* Creates the outer gap for the floating effect */
        height: 100vh;
        font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: var(--content-bg); /* Applies gradient to entire screen */
        color: var(--text);
        overflow: hidden; 
      }

      /* FLOATING ISLAND STRUCTURE */
      .layout { 
        display: flex; 
        gap: 24px; /* Gap between the floating islands */
        height: 100%; 
        width: 100%; 
      }
      
      /* Base styles for all floating windows */
      .floating-window {
        background: var(--panel);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
      }

      /* 1. SERVER RAIL */
      .sidebar { 
        width: 84px; 
        flex-shrink: 0; 
        padding: 20px 0; 
        z-index: 10;
        overflow-y: auto; 
        scrollbar-width: none; 
        /* Changed from flex to block to stop height crushing */
        display: block; 
      }
      .sidebar::-webkit-scrollbar { display: none; } 
      
      .server-rail { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        gap: 16px; 
        width: 100%; 
        /* This tells the rail it is allowed to be taller than the screen */
        min-height: min-content; 
      }
      
      .server-separator { 
        width: 32px; 
        height: 2px; 
        min-height: 2px; /* Lock separator height */
        background: var(--border); 
        border-radius: 2px; 
      }
      
      .server-item { 
        position: relative; 
        /* The !important tags force the browser to respect the size */
        width: 54px !important; 
        height: 54px !important; 
        min-width: 54px !important; 
        min-height: 54px !important; 
        flex: 0 0 54px !important; 
        
        border-radius: 16px; 
        border: 1px solid transparent; 
        background: var(--panel-2); 
        color: var(--text); 
        font-weight: 700; 
        font-size: 16px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0;
        overflow: visible;
      }
      .server-item:hover { border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); transform: translateY(-3px); }
      .server-item.active { background: var(--primary); border-color: var(--primary); box-shadow: 0 0 20px var(--primary-glow); color: #fff; }
      
      .server-item-indicator { position: absolute; left: -16px; width: 6px; height: 20px; border-radius: 4px; background: var(--primary); opacity: 0; transition: all 0.3s ease; box-shadow: 0 0 10px var(--primary-glow); }
      .server-item.active .server-item-indicator { opacity: 1; height: 32px; }
      
      .server-avatar { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
      .server-fallback { font-weight: 700; font-size: 1rem; }
      .server-status { position: absolute; right: -4px; bottom: -4px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #141622; background: var(--success); z-index: 2; box-shadow: 0 0 10px var(--success); }
      .server-status.offline { background: var(--muted); box-shadow: none; border-color: transparent; }

      /* 2. SECONDARY SIDEBAR */
      .secondary-sidebar { 
        width: 280px; flex-shrink: 0; 
        display: flex; flex-direction: column; z-index: 9; 
        overflow: hidden; /* Keeps user area inside border radius */
      }
      .sidebar-header { height: 72px; padding: 0 24px; display: flex; align-items: center; font-weight: 800; font-size: 18px; letter-spacing: 1px; text-transform: uppercase; background: linear-gradient(90deg, #fff, var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border-bottom: 1px solid var(--border); flex-shrink: 0; }
      .sidebar-content { flex: 1; overflow-y: auto; padding: 20px 16px; scrollbar-width: none; }
      .sidebar-content::-webkit-scrollbar { display: none; }
      
      .category-header { font-size: 11px; font-weight: 800; color: var(--primary); text-transform: uppercase; margin: 24px 8px 8px; letter-spacing: 1.5px; opacity: 0.8; }
      .category-header:first-child { margin-top: 0; }
      
      .channel-btn { 
        width: 100%; text-align: left; padding: 12px 16px; border-radius: 12px; background: transparent; border: 1px solid transparent; 
        color: var(--muted); display: flex; align-items: center; gap: 12px; font-size: 14px; font-weight: 600; margin-bottom: 6px; transition: all 0.2s; 
      }
      .channel-btn:hover { background: var(--panel-2); color: var(--text); transform: translateX(4px); }
      .channel-btn.active { background: rgba(88, 101, 242, 0.15); border-left: 4px solid var(--primary); color: #fff; transform: translateX(4px); }
      
      .user-area { height: 80px; background: rgba(0,0,0,0.2); padding: 0 20px; display: flex; align-items: center; flex-shrink: 0; gap: 14px; border-top: 1px solid var(--border); }
      .user-avatar-small { 
        width: 44px; 
        height: 44px; 
        min-width: 44px; 
        min-height: 44px; 
        flex: 0 0 44px;
        
        border-radius: 14px; 
        background: var(--primary); 
        border: 2px solid var(--border); 
        padding: 2px; 
      }
      .user-details { display: flex; flex-direction: column; line-height: 1.4; }
      .user-details .name { color: #fff; font-size: 15px; font-weight: 700; }
      .user-details .sub { color: var(--primary); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

      /* 3. MAIN CONTENT */
      .content { flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 24px; }
      
      /* Topbar is its own floating island now */
      .topbar { height: 72px; padding: 0 28px; display: flex; align-items: center; font-weight: 700; font-size: 20px; letter-spacing: 0.5px; z-index: 5; flex-shrink: 0; }
      
      /* Container background is transparent so inner panels float over the main gradient */
      .container { flex: 1; padding: 0 8px 0 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--primary) transparent; }
      .container::-webkit-scrollbar { width: 6px; }
      .container::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 3px; }
      
      .section-title { font-size: 26px; font-weight: 800; margin: 0 0 24px 0; color: #fff; letter-spacing: -0.5px; }
      .subtitle { margin-top: 6px; color: var(--muted); font-size: 14px; line-height: 1.5; }
      
      .grid { display: grid; gap: 24px; }
      .cards { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
      
      /* The content panels are also floating windows */
      .panel { 
        background: var(--panel); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid var(--border); border-radius: 20px; padding: 28px; 
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); transition: transform 0.3s, box-shadow 0.3s; 
      }
      .panel:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(88, 101, 242, 0.1); border-color: rgba(88, 101, 242, 0.3); }
      
      /* Inputs & Forms */
      .home-sections { display: flex; flex-wrap: wrap; gap: 24px; margin-bottom: 40px; }
      .home-section-panel { flex: 0 0 100%; max-width: 100%; }
      .home-width-50 { flex-basis: calc(50% - 12px); max-width: calc(50% - 12px); }
      @media (max-width: 1300px) { .home-width-50 { flex-basis: 100%; max-width: 100%; } }
      
      .home-fields { display: grid; gap: 20px; margin-top: 24px; }
      .home-field { display: grid; gap: 10px; }
      .home-field label { color: var(--muted); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
      
      .home-input, .home-textarea, .home-select { 
        width: 100%; border: 1px solid var(--border); background: var(--panel-2); color: #fff; 
        border-radius: 12px; padding: 14px 18px; font-size: 15px; outline: none; transition: all 0.3s ease; 
      }
      .home-input:focus, .home-textarea:focus, .home-select:focus { 
        border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); background: rgba(0,0,0,0.6); 
      }
      .home-textarea { min-height: 120px; resize: vertical; }
      
      .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
      button { 
        border: 1px solid var(--border); background: rgba(255,255,255,0.05); color: #fff; 
        border-radius: 10px; padding: 12px 24px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; 
        transition: all 0.2s; backdrop-filter: blur(4px);
      }
      button:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
      button.primary { background: linear-gradient(135deg, var(--primary), #7c88f9); border: none; box-shadow: 0 4px 15px var(--primary-glow); }
      button.primary:hover { box-shadow: 0 6px 20px var(--primary-glow); filter: brightness(1.1); }
      button.danger { background: linear-gradient(135deg, var(--danger), #ff7a59); border: none; box-shadow: 0 4px 15px rgba(255, 61, 0, 0.3); }
      .cursor-pointer { cursor: pointer; }

      .home-field-row { display: flex; align-items: center; gap: 12px; }
      .home-checkbox { width: 24px; height: 24px; accent-color: var(--primary); border-radius: 6px; }
      
      .lookup-wrap { position: relative; }
      .lookup-results { position: absolute; left: 0; right: 0; top: calc(100% + 8px); z-index: 20; background: #0e101a; border: 1px solid var(--primary); border-radius: 12px; max-height: 220px; overflow: auto; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--primary-glow); }
      .lookup-item { width: 100%; text-align: left; padding: 14px; background: transparent; border: none; border-bottom: 1px solid var(--border); color: var(--text); }
      .lookup-item:hover { background: var(--primary); color: #fff; }

      .value { font-size: 36px; font-weight: 800; background: linear-gradient(to right, #fff, #aab4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-top: 10px; }
      .title { color: var(--primary); font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; }

      .list-editor { background: var(--panel-2); border: 1px solid var(--border); border-radius: 12px; padding: 16px; display: grid; gap: 12px; }
      .list-item { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; background: rgba(0,0,0,0.5); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; transition: border-color 0.2s; }
      .list-item:hover { border-color: var(--primary); }
      .list-input { width: 100%; border: none; background: transparent; color: #fff; outline: none; font-size: 15px; }
      .drag-handle { color: var(--primary); font-size: 18px; }
      
      ${design.customCss ?? ""}
    </style>
</head>
<body>
    <div class="layout">
        <nav class="sidebar floating-window">
            <div id="serverRail" class="server-rail"></div>
        </nav>

        <aside class="secondary-sidebar floating-window">
            <header class="sidebar-header brand">${safeName}</header>
            <div class="sidebar-content">
                <div class="category-header">System</div>
                <button id="tabHome" class="channel-btn cursor-pointer active">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Dashboard
                </button>
                <button id="tabPlugins" class="channel-btn cursor-pointer">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                    Extensions
                </button>
                
                <div class="category-header" style="margin-top: 32px;">Modules</div>
                <div id="homeCategories"></div>
            </div>
            
            <div class="user-area" id="userMeta">
                <div class="user-avatar-small"></div>
                <div class="user-details">
                    <span class="name">Initializing...</span>
                    <span class="sub">Standby</span>
                </div>
            </div>
        </aside>

        <main class="content">
            <header class="topbar floating-window">
                <span id="centerTitle" style="background: linear-gradient(90deg, #fff, var(--muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Interface Active</span>
            </header>

            <div class="container">
                <section id="homeArea">
                    <div class="section-title">Configuration Matrix</div>
                    <section id="homeSections" class="home-sections"></section>

                    <section id="overviewArea">
                        <div class="section-title" style="margin-top: 24px;">Telemetry Data</div>
                        <section id="overviewCards" class="grid cards"></section>
                    </section>
                </section>

                <section id="pluginsArea" style="display:none;">
                    <div class="section-title">Active Extensions</div>
                    <section id="plugins" class="grid"></section>
                </section>
            </div>
        </main>
    </div>

    <script>
    const dashboardConfig = ${scriptData};
    const state = { session: null, guilds: [], selectedGuildId: null, homeCategories: [], selectedHomeCategoryId: null, activeMainTab: "home" };

    const el = {
        serverRail: document.getElementById("serverRail"), userMeta: document.getElementById("userMeta"),
        centerTitle: document.getElementById("centerTitle"), tabHome: document.getElementById("tabHome"),
        tabPlugins: document.getElementById("tabPlugins"), homeArea: document.getElementById("homeArea"),
        pluginsArea: document.getElementById("pluginsArea"), homeCategories: document.getElementById("homeCategories"),
        homeSections: document.getElementById("homeSections"), overviewArea: document.getElementById("overviewArea"),
        overviewCards: document.getElementById("overviewCards"), plugins: document.getElementById("plugins")
    };

    const fetchJson = async (url, init) => {
        const response = await fetch(url, init);
        if (!response.ok) throw new Error(await response.text());
        return response.json();
    };

    const buildApiUrl = (path) => {
        if (!state.selectedGuildId) return dashboardConfig.basePath + path;
        const separator = path.includes("?") ? "&" : "?";
        return dashboardConfig.basePath + path + separator + "guildId=" + encodeURIComponent(state.selectedGuildId);
    };

    const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
    const normalizeBoxWidth = (value) => [50, 33, 20].includes(Number(value)) ? Number(value) : 100;

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
                    panelElement.querySelectorAll("[data-plugin-field-id]").forEach((inputEl) => {
                        const fieldId = inputEl.dataset.pluginFieldId;
                        if (fieldId) values[fieldId] = toFieldValue({ type: inputEl.dataset.pluginFieldType || "text" }, inputEl);
                    });
                    payload = { panelId, values };
                }

                const result = await fetchJson(buildApiUrl("/api/plugins/" + encodeURIComponent(pluginId) + "/" + encodeURIComponent(action.id)), {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
                });
                if (result.message) alert(result.message);
                if (result.refresh) await refreshContent();
            } catch (error) { alert(error instanceof Error ? error.message : "Action failed"); } 
            finally { button.disabled = false; }
        });
        return button;
    };

    const renderCards = (cards) => {
        if (!cards.length) { el.overviewCards.innerHTML = '<div style="color:var(--muted)">Awaiting telemetry...</div>'; return; }
        el.overviewCards.innerHTML = cards.map((card) => 
            '<article class="panel"><div class="title">' + escapeHtml(card.title) + '</div><div class="value">' + escapeHtml(card.value) + '</div>' + 
            (card.subtitle ? '<div class="subtitle">' + escapeHtml(card.subtitle) + '</div>' : "") + '</article>'
        ).join("");
    };

    const shortName = (name) => {
        if (!name) return "?";
        const parts = String(name).trim().split(/\\s+/).filter(Boolean);
        return parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[1][0]).toUpperCase();
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
        const meItem = { id: null, name: "Global Control", short: "HQ", avatarUrl: state.session?.user?.avatarUrl ?? null, botInGuild: true };
        el.serverRail.innerHTML = "";
        
        const meBtn = document.createElement("button");
        meBtn.className = "server-item cursor-pointer" + (null === state.selectedGuildId ? " active" : "");
        meBtn.title = meItem.name;
        
        const meInd = document.createElement("span");
        meInd.className = "server-item-indicator";
        meBtn.appendChild(meInd);
        addAvatarOrFallback(meBtn, meItem);
        
        meBtn.addEventListener("click", async () => {
            state.selectedGuildId = null;
            renderServerRail();
            updateContextLabel();
            await refreshContent();
        });
        
        el.serverRail.appendChild(meBtn);
        
        const sep = document.createElement("div");
        sep.className = "server-separator";
        el.serverRail.appendChild(sep);

        state.guilds.forEach((guild) => {
            const item = { id: guild.id, name: guild.name, short: shortName(guild.name), avatarUrl: guild.iconUrl ?? null, botInGuild: guild.botInGuild !== false, inviteUrl: guild.inviteUrl };
            const button = document.createElement("button");
            button.className = "server-item cursor-pointer" + (item.id === state.selectedGuildId ? " active" : "");
            button.title = item.id && !item.botInGuild ? (item.name + " • Deploy Bot") : item.name;

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
                    if (!opened) alert("Popup blocked. Please allow popups to open the deployment page.");
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
        el.tabHome.classList.toggle("active", homeActive);
        el.tabPlugins.classList.toggle("active", !homeActive);
    };

    const updateContextLabel = () => {
        if (!state.selectedGuildId) { el.centerTitle.textContent = "Global Dashboard"; return; }
        const selectedGuild = state.guilds.find((guild) => guild.id === state.selectedGuildId);
        el.centerTitle.textContent = selectedGuild ? selectedGuild.name : "System Interface";
    };

    const renderUserBlock = () => {
        const user = state.session?.user;
        if (!user) return;
        const avatarHtml = user.avatarUrl ? '<img src="'+user.avatarUrl+'" style="width:100%;height:100%;border-radius:12px;object-fit:cover;">' : '';
        el.userMeta.innerHTML = 
            '<div class="user-avatar-small">'+avatarHtml+'</div>' +
            '<div class="user-details"><span class="name">' + escapeHtml(user.global_name || user.username) + '</span><span class="sub">' + state.guilds.length + ' Nodes</span></div>';
    };

    const renderHomeCategories = () => {
        el.homeCategories.innerHTML = "";
        if (!state.homeCategories.length) return;
        state.homeCategories.forEach((category) => {
            const button = document.createElement("button");
            button.className = "channel-btn cursor-pointer" + (state.selectedHomeCategoryId === category.id ? " active" : "");
            button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> ' + escapeHtml(category.label);
            button.title = category.description || category.label;
            button.addEventListener("click", async () => { state.selectedHomeCategoryId = category.id; renderHomeCategories(); await refreshContent(); });
            el.homeCategories.appendChild(button);
        });
    };

    const toFieldValue = (field, element) => {
        if (field.type === "string-list") { try { return JSON.parse(element.dataset.listValues || "[]"); } catch { return []; } }
        if (["role-search", "channel-search", "member-search"].includes(field.type)) { try { return JSON.parse(element.dataset.selectedObject || "null"); } catch { return null; } }
        if (field.type === "boolean") return Boolean(element.checked);
        if (field.type === "number") return element.value === "" ? null : Number(element.value);
        return element.value;
    };

    const setupStringListField = (field, input, fieldWrap) => {
        const editor = document.createElement("div"); editor.className = "list-editor";
        const itemsWrap = document.createElement("div"); itemsWrap.className = "list-items";
        const addButton = document.createElement("button"); addButton.type = "button"; addButton.className = "list-add cursor-pointer"; addButton.textContent = "+ Add Sequence";

        const normalizeValues = () => { input.dataset.listValues = JSON.stringify(Array.from(itemsWrap.querySelectorAll(".list-input")).map(i => i.value.trim()).filter(i => i.length > 0)); };

        const makeRow = (value = "") => {
            const row = document.createElement("div"); row.className = "list-item"; row.draggable = true;
            const handle = document.createElement("span"); handle.className = "drag-handle cursor-pointer"; handle.innerHTML = "⣿";
            const textInput = document.createElement("input"); textInput.type = "text"; textInput.className = "list-input"; textInput.value = value;
            textInput.addEventListener("input", normalizeValues);
            const removeBtn = document.createElement("button"); removeBtn.type = "button"; removeBtn.className = "cursor-pointer"; removeBtn.textContent = "×"; removeBtn.style.padding = "4px 8px"; removeBtn.style.background = "transparent"; removeBtn.style.color = "var(--danger)";
            removeBtn.addEventListener("click", () => { row.remove(); normalizeValues(); });
            row.append(handle, textInput, removeBtn);
            return row;
        };

        const initialValues = Array.isArray(field.value) ? field.value.map(String) : [];
        if (!initialValues.length) initialValues.push("Value_01");
        initialValues.forEach(v => itemsWrap.appendChild(makeRow(v)));

        addButton.addEventListener("click", () => { itemsWrap.appendChild(makeRow("")); normalizeValues(); });
        editor.append(itemsWrap, addButton); fieldWrap.appendChild(editor); normalizeValues();
    };

    const showLookupResults = (container, items, labelResolver, onSelect) => {
        container.innerHTML = "";
        if (!items.length) { container.style.display = "none"; return; }
        items.forEach(item => {
            const btn = document.createElement("button"); btn.type = "button"; btn.className = "lookup-item cursor-pointer"; btn.textContent = labelResolver(item);
            btn.addEventListener("click", () => { onSelect(item); container.style.display = "none"; });
            container.appendChild(btn);
        });
        container.style.display = "block";
    };

    const setupLookupField = (field, input, fieldWrap) => {
        const wrap = document.createElement("div"); wrap.className = "lookup-wrap";
        const results = document.createElement("div"); results.className = "lookup-results";
        wrap.append(input, results); fieldWrap.appendChild(wrap);

        const runSearch = async () => {
            const query = String(input.value || "");
            if (query.length < 1) { results.style.display = "none"; return; }
            try {
                const params = new URLSearchParams({ q: query, limit: "10" });
                const ep = field.type === "role-search" ? "roles" : field.type === "channel-search" ? "channels" : "members";
                const payload = await fetchJson(buildApiUrl("/api/lookup/" + ep + "?" + params));
                
                showLookupResults(results, payload[ep] || [], 
                    (item) => field.type === "channel-search" ? "#"+item.name : (item.name || item.user?.username), 
                    (item) => { input.value = item.name || item.user?.username; input.dataset.selectedObject = JSON.stringify(item); }
                );
            } catch { results.style.display = "none"; }
        };
        input.addEventListener("input", () => { input.dataset.selectedObject = ""; runSearch(); });
        input.addEventListener("blur", () => setTimeout(() => { results.style.display = "none"; }, 150));
    };

    const renderHomeSections = (sections) => {
        el.homeSections.innerHTML = "";
        if (!sections.length) return;
        
        sections.forEach((section) => {
            const wrap = document.createElement("article");
            wrap.className = "panel home-section-panel home-width-" + normalizeBoxWidth(section.width);

            const heading = document.createElement("h3"); heading.textContent = section.title; heading.style.margin = "0"; wrap.appendChild(heading);
            if (section.description) { const desc = document.createElement("div"); desc.className = "subtitle"; desc.textContent = section.description; wrap.appendChild(desc); }

            if (section.fields?.length) {
                const fieldsWrap = document.createElement("div"); fieldsWrap.className = "home-fields";

                section.fields.forEach((field) => {
                    const fieldWrap = document.createElement("div"); fieldWrap.className = "home-field";
                    const label = document.createElement("label"); label.textContent = field.label; fieldWrap.appendChild(label);

                    let input;
                    if (field.type === "textarea") {
                        input = document.createElement("textarea"); input.className = "home-textarea"; input.value = field.value == null ? "" : String(field.value);
                    } else if (field.type === "select") {
                        input = document.createElement("select"); input.className = "home-select cursor-pointer";
                        (field.options || []).forEach((opt) => {
                            const optionEl = document.createElement("option"); optionEl.value = opt.value; optionEl.textContent = opt.label;
                            if (String(field.value ?? "") === opt.value) optionEl.selected = true; input.appendChild(optionEl);
                        });
                    } else if (field.type === "boolean") {
                        const row = document.createElement("div"); row.className = "home-field-row";
                        input = document.createElement("input"); input.type = "checkbox"; input.className = "home-checkbox cursor-pointer"; input.checked = Boolean(field.value);
                        const stateText = document.createElement("span"); stateText.textContent = input.checked ? "Enabled" : "Disabled";
                        input.addEventListener("change", () => stateText.textContent = input.checked ? "Enabled" : "Disabled");
                        row.append(input, stateText); fieldWrap.appendChild(row);
                    } else {
                        input = document.createElement("input"); input.className = "home-input"; input.type = field.type === "number" ? "number" : field.type === "url" ? "url" : "text"; input.value = field.value == null ? "" : String(field.value);
                    }

                    if (input) {
                        input.dataset.homeFieldId = field.id; input.dataset.homeFieldType = field.type;
                        if (field.placeholder) input.placeholder = field.placeholder;
                        if (field.readOnly) { input.readOnly = true; input.disabled = true; input.style.opacity = "0.6"; }
                        if (["role-search", "channel-search", "member-search"].includes(field.type)) setupLookupField(field, input, fieldWrap);
                        else if (field.type === "string-list") setupStringListField(field, input, fieldWrap);
                        else if (field.type !== "boolean") fieldWrap.appendChild(input);
                    }
                    fieldsWrap.appendChild(fieldWrap);
                });
                wrap.appendChild(fieldsWrap);
            }

            if (section.actions?.length) {
                const actions = document.createElement("div"); actions.className = "actions";
                section.actions.forEach((action) => {
                    const button = document.createElement("button"); button.textContent = action.label;
                    const variantClass = action.variant === "primary" ? "primary" : action.variant === "danger" ? "danger" : "";
                    button.className = [variantClass, "cursor-pointer"].filter(Boolean).join(" ");
                    button.addEventListener("click", async () => {
                        button.disabled = true;
                        try {
                            const values = {};
                            wrap.querySelectorAll("[data-home-field-id]").forEach((el) => { values[el.dataset.homeFieldId] = toFieldValue({ type: el.dataset.homeFieldType }, el); });
                            const result = await fetchJson(buildApiUrl("/api/home/" + encodeURIComponent(action.id)), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId: section.id, values }) });
                            if (result.message) alert(result.message);
                            if (result.refresh) await refreshContent();
                        } catch (error) { alert("Execution Failed"); } finally { button.disabled = false; }
                    });
                    actions.appendChild(button);
                });
                wrap.appendChild(actions);
            }
            el.homeSections.appendChild(wrap);
        });
    };

    const renderPlugins = (plugins) => {
        el.plugins.innerHTML = "";
        if (!plugins.length) { el.plugins.innerHTML = '<div style="color:var(--muted)">No modules online.</div>'; return; }
        
        plugins.forEach((plugin) => {
            const wrap = document.createElement("article"); wrap.className = "panel";
            const heading = document.createElement("h3"); heading.textContent = plugin.name; heading.style.margin="0"; wrap.appendChild(heading);
            if (plugin.description) { const desc = document.createElement("div"); desc.className = "subtitle"; desc.textContent = plugin.description; wrap.appendChild(desc); }

            (plugin.panels || []).forEach((panel) => {
                const pBody = document.createElement("div"); pBody.style.marginTop = "24px";
                const pTitle = document.createElement("h4"); pTitle.textContent = panel.title; pTitle.style.margin = "0 0 12px 0"; pTitle.style.color = "var(--primary)"; pTitle.style.textTransform = "uppercase"; pBody.appendChild(pTitle);
                
                if (panel.fields?.length) {
                    const fWrap = document.createElement("div"); fWrap.className = "home-fields";
                    panel.fields.forEach((field) => {
                        const fw = document.createElement("div"); fw.className = "home-field";
                        if (!field.editable) {
                            fw.innerHTML = '<label>' + escapeHtml(field.label) + '</label><div style="padding:14px 18px;background:var(--panel-2);border-radius:12px;border:1px solid var(--border);">' + escapeHtml(field.value) + '</div>';
                        } else {
                            fw.innerHTML = '<label>' + escapeHtml(field.label) + '</label><input type="text" class="home-input" data-plugin-field-id="'+field.id+'" value="'+escapeHtml(field.value)+'">';
                        }
                        fWrap.appendChild(fw);
                    });
                    pBody.appendChild(fWrap);
                }

                if (panel.actions?.length) {
                    const actions = document.createElement("div"); actions.className = "actions";
                    panel.actions.forEach((act) => actions.appendChild(makeButton(act, plugin.id, panel.id, pBody)));
                    pBody.appendChild(actions);
                }
                wrap.appendChild(pBody);
            });
            el.plugins.appendChild(wrap);
        });
    };

    const refreshContent = async () => {
        const categoriesPayload = await fetchJson(buildApiUrl("/api/home/categories"));
        state.homeCategories = categoriesPayload.categories || [];
        if (!state.selectedHomeCategoryId || !state.homeCategories.some(i => i.id === state.selectedHomeCategoryId)) {
            state.selectedHomeCategoryId = state.homeCategories.find(i => i.id === "overview")?.id || state.homeCategories[0]?.id || null;
        }
        renderHomeCategories();

        const homePath = state.selectedHomeCategoryId ? "/api/home?categoryId=" + encodeURIComponent(state.selectedHomeCategoryId) : "/api/home";
        const [home, overview, plugins] = await Promise.all([ fetchJson(buildApiUrl(homePath)), fetchJson(buildApiUrl("/api/overview")), fetchJson(buildApiUrl("/api/plugins")) ]);

        renderHomeSections(home.sections || []);
        el.overviewArea.style.display = state.selectedHomeCategoryId === "overview" ? "block" : "none";
        renderCards(overview.cards || []);
        renderPlugins(plugins.plugins || []);
    };

    const loadInitialData = async () => {
        const session = await fetchJson(dashboardConfig.basePath + "/api/session");
        if (!session.authenticated) { window.location.href = dashboardConfig.basePath + "/login"; return; }

        state.session = session;
        const guilds = await fetchJson(dashboardConfig.basePath + "/api/guilds");
        state.guilds = guilds.guilds || [];
        
        renderUserBlock();
        renderServerRail();
        updateContextLabel();

        el.tabHome.addEventListener("click", () => { state.activeMainTab = "home"; applyMainTab(); });
        el.tabPlugins.addEventListener("click", () => { state.activeMainTab = "plugins"; applyMainTab(); });

        applyMainTab();
        await refreshContent();
    };

    loadInitialData().catch(console.error);
    </script>
</body>
</html>`;
}
