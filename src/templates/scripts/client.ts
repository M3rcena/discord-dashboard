export function getClientScript(basePath: string, setupDesign: any = {}): string {
  const scriptData = JSON.stringify({ basePath, setupDesign });

  return `
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
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      };
  
      const buildApiUrl = (path) => {
        if (!state.selectedGuildId) return dashboardConfig.basePath + path;
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
        if (numeric === 50 || numeric === 33 || numeric === 20) return numeric;
        return 100;
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
                if (!fieldId) return;
                values[fieldId] = toFieldValue({ type: fieldType }, inputEl);
              });
              payload = { panelId, values };
            }
  
            const actionUrl = buildApiUrl("/api/plugins/" + encodeURIComponent(pluginId) + "/" + encodeURIComponent(action.id));
            const result = await fetchJson(actionUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });
            if (result.message) alert(result.message);
            if (result.refresh) await refreshContent();
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
        const parts = String(name).trim().split(/\\s+/).filter(Boolean);
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
              if (!opened && typeof alert === "function") alert("Popup blocked. Please allow popups.");
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
          if (!raw) return [];
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
          } catch { return []; }
        }
        if (field.type === "role-search" || field.type === "channel-search" || field.type === "member-search") {
          const raw = element.dataset.selectedObject;
          if (!raw) return null;
          try { return JSON.parse(raw); } catch { return null; }
        }
        if (field.type === "boolean") return Boolean(element.checked);
        if (field.type === "number") return element.value === "" ? null : Number(element.value);
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
          const values = Array.from(itemsWrap.querySelectorAll(".list-input")).map((item) => item.value.trim()).filter((item) => item.length > 0);
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
          removeButton.addEventListener("click", () => { row.remove(); normalizeValues(); });
  
          row.addEventListener("dragstart", () => row.classList.add("dragging"));
          row.addEventListener("dragend", () => { row.classList.remove("dragging"); normalizeValues(); });
  
          row.appendChild(handle); row.appendChild(textInput); row.appendChild(removeButton);
          return row;
        };
  
        itemsWrap.addEventListener("dragover", (event) => {
          event.preventDefault();
          const dragging = itemsWrap.querySelector(".dragging");
          if (!dragging) return;
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
          if (!inserted) itemsWrap.appendChild(dragging);
        });
  
        const initialValues = Array.isArray(field.value) ? field.value.map((item) => String(item)) : [];
        if (initialValues.length === 0) initialValues.push("Yes", "No");
        initialValues.forEach((value) => itemsWrap.appendChild(makeRow(value)));
  
        addButton.addEventListener("click", () => { itemsWrap.appendChild(makeRow("")); normalizeValues(); });
        editor.appendChild(itemsWrap); editor.appendChild(addButton); fieldWrap.appendChild(editor);
        normalizeValues();
      };
  
      const showLookupResults = (container, items, labelResolver, onSelect) => {
        container.innerHTML = "";
        if (!items.length) { container.style.display = "none"; return; }
        items.forEach((item) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "lookup-item cursor-pointer";
          btn.textContent = labelResolver(item);
          btn.addEventListener("click", () => { onSelect(item); container.style.display = "none"; });
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
  
        wrap.appendChild(input); wrap.appendChild(results); fieldWrap.appendChild(wrap); fieldWrap.appendChild(selected);
  
        const minQueryLength = Math.max(0, field.lookup?.minQueryLength ?? 1);
        const limit = Math.max(1, Math.min(field.lookup?.limit ?? 10, 50));
  
        const runSearch = async () => {
          const query = String(input.value || "");
          if (query.length < minQueryLength) { results.style.display = "none"; return; }
          try {
            if (field.type === "role-search") {
              const params = new URLSearchParams({ q: query, limit: String(limit) });
              if (field.lookup?.includeManaged !== undefined) params.set("includeManaged", String(Boolean(field.lookup.includeManaged)));
              const payload = await fetchJson(buildApiUrl("/api/lookup/roles?" + params.toString()));
              showLookupResults(results, payload.roles || [], (item) => "@" + item.name, (item) => {
                input.value = item.name;
                input.dataset.selectedObject = JSON.stringify(item);
                selected.textContent = "Selected role: @" + item.name + " (" + item.id + ")";
              });
            } else if (field.type === "channel-search") {
              const params = new URLSearchParams({ q: query, limit: String(limit) });
              if (field.lookup?.nsfw !== undefined) params.set("nsfw", String(Boolean(field.lookup.nsfw)));
              if (field.lookup?.channelTypes && field.lookup.channelTypes.length > 0) params.set("channelTypes", field.lookup.channelTypes.join(","));
              const payload = await fetchJson(buildApiUrl("/api/lookup/channels?" + params.toString()));
              showLookupResults(results, payload.channels || [], (item) => "#" + item.name, (item) => {
                input.value = item.name;
                input.dataset.selectedObject = JSON.stringify(item);
                selected.textContent = "Selected channel: #" + item.name + " (" + item.id + ")";
              });
            } else if (field.type === "member-search") {
              const params = new URLSearchParams({ q: query, limit: String(limit) });
              const payload = await fetchJson(buildApiUrl("/api/lookup/members?" + params.toString()));
              showLookupResults(results, payload.members || [], 
                (item) => (item?.user?.username || "unknown") + (item?.nick ? " (" + item.nick + ")" : ""), 
                (item) => {
                  const username = item?.user?.username || "unknown";
                  input.value = username;
                  input.dataset.selectedObject = JSON.stringify(item);
                  selected.textContent = "Selected member: " + username + " (" + (item?.user?.id || "unknown") + ")";
                });
            }
          } catch { results.style.display = "none"; }
        };
  
        input.addEventListener("input", () => { input.dataset.selectedObject = ""; selected.textContent = "No selection"; runSearch(); });
        input.addEventListener("blur", () => setTimeout(() => { results.style.display = "none"; }, 120));
      };
  
      const renderHomeSections = (sections) => {
        if (!sections.length) { el.homeSections.innerHTML = '<div class="empty">No home sections configured.</div>'; return; }
        el.homeSections.innerHTML = "";
        sections.forEach((section) => {
          const wrap = document.createElement("article");
          wrap.className = "panel home-section-panel home-width-" + normalizeBoxWidth(section.width);
  
          const heading = document.createElement("h3");
          heading.textContent = section.title; heading.style.margin = "0"; wrap.appendChild(heading);
  
          if (section.description) {
            const desc = document.createElement("div");
            desc.className = "subtitle"; desc.textContent = section.description; wrap.appendChild(desc);
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
              label.textContent = field.label; fieldWrap.appendChild(label);
  
              let input;
              if (field.type === "textarea") {
                input = document.createElement("textarea"); input.className = "home-textarea"; input.value = field.value == null ? "" : String(field.value);
              } else if (field.type === "select") {
                input = document.createElement("select"); input.className = "home-select cursor-pointer";
                (field.options || []).forEach((option) => {
                  const optionEl = document.createElement("option"); optionEl.value = option.value; optionEl.textContent = option.label;
                  if (String(field.value ?? "") === option.value) optionEl.selected = true;
                  input.appendChild(optionEl);
                });
              } else if (field.type === "boolean") {
                const row = document.createElement("div"); row.className = "home-field-row";
                input = document.createElement("input"); input.type = "checkbox"; input.className = "home-checkbox cursor-pointer"; input.checked = Boolean(field.value);
                const stateText = document.createElement("span"); stateText.textContent = input.checked ? "Enabled" : "Disabled";
                input.addEventListener("change", () => stateText.textContent = input.checked ? "Enabled" : "Disabled");
                row.appendChild(input); row.appendChild(stateText); fieldWrap.appendChild(row);
              } else {
                input = document.createElement("input"); input.className = "home-input";
                input.type = field.type === "number" ? "number" : "text"; input.value = field.value == null ? "" : String(field.value);
              }
  
              if (input) {
                input.dataset.homeFieldId = field.id; input.dataset.homeFieldType = field.type;
                if (field.placeholder && "placeholder" in input) input.placeholder = field.placeholder;
                if (field.required && "required" in input) input.required = true;
                if (field.readOnly) { if ("readOnly" in input) input.readOnly = true; if ("disabled" in input) input.disabled = true; }
  
                if (field.type === "role-search" || field.type === "channel-search" || field.type === "member-search") { setupLookupField(field, input, fieldWrap); }
                else if (field.type !== "boolean") { fieldWrap.appendChild(input); }
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
                  const inputs = wrap.querySelectorAll("[data-home-field-id]");
                  inputs.forEach((inputEl) => {
                    const fieldId = inputEl.dataset.homeFieldId;
                    const fieldType = inputEl.dataset.homeFieldType || "text";
                    if (!fieldId) return;
                    values[fieldId] = toFieldValue({ type: fieldType }, inputEl);
                  });
                  const result = await fetchJson(buildApiUrl("/api/home/" + encodeURIComponent(action.id)), {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId: section.id, values })
                  });
                  message.textContent = result.message || "Saved.";
                  if (result.refresh) await refreshContent();
                } catch (error) { message.textContent = error instanceof Error ? error.message : "Save failed"; }
                finally { button.disabled = false; }
              });
              actions.appendChild(button);
            });
            wrap.appendChild(actions);
          }
          wrap.appendChild(message); el.homeSections.appendChild(wrap);
        });
      };
  
      const renderPlugins = (plugins) => {
        if (!plugins.length) { el.plugins.innerHTML = '<div class="empty">No plugins configured yet.</div>'; return; }
        el.plugins.innerHTML = "";
        plugins.forEach((plugin) => {
          const wrap = document.createElement("article"); wrap.className = "panel";
          const heading = document.createElement("div"); heading.className = "title"; heading.textContent = plugin.name; wrap.appendChild(heading);
          if (plugin.description) { const desc = document.createElement("div"); desc.className = "subtitle"; desc.textContent = plugin.description; wrap.appendChild(desc); }
  
          (plugin.panels || []).forEach((panel) => {
            const panelBody = document.createElement("div");
            const panelTitle = document.createElement("h4"); panelTitle.textContent = panel.title; panelTitle.style.marginBottom = "4px"; panelBody.appendChild(panelTitle);
            if (panel.description) { const p = document.createElement("div"); p.className = "subtitle"; p.textContent = panel.description; panelBody.appendChild(p); }
  
            if (panel.fields?.length) {
              const fieldsWrap = document.createElement("div"); fieldsWrap.className = "plugin-fields";
              panel.fields.forEach((field) => {
                const fieldWrap = document.createElement("div"); fieldWrap.className = field.editable ? "plugin-field" : "kv-item";
  
                if (!field.editable) {
                  const display = field.value == null ? "" : typeof field.value === "object" ? JSON.stringify(field.value) : String(field.value);
                  fieldWrap.innerHTML = '<strong>' + escapeHtml(field.label) + '</strong><span>' + escapeHtml(display) + '</span>';
                  fieldsWrap.appendChild(fieldWrap); return;
                }
  
                const label = document.createElement("label"); label.textContent = field.label; fieldWrap.appendChild(label);
  
                let input;
                if (field.type === "textarea") { input = document.createElement("textarea"); input.className = "home-textarea"; input.value = field.value == null ? "" : String(field.value); }
                else if (field.type === "select") {
                  input = document.createElement("select"); input.className = "home-select cursor-pointer";
                  (field.options || []).forEach((option) => {
                    const optionEl = document.createElement("option"); optionEl.value = option.value; optionEl.textContent = option.label;
                    if (String(field.value ?? "") === option.value) optionEl.selected = true;
                    input.appendChild(optionEl);
                  });
                } else if (field.type === "boolean") {
                  const row = document.createElement("div"); row.className = "home-field-row";
                  input = document.createElement("input"); input.type = "checkbox"; input.className = "home-checkbox cursor-pointer"; input.checked = Boolean(field.value);
                  const stateText = document.createElement("span"); stateText.textContent = input.checked ? "Enabled" : "Disabled";
                  input.addEventListener("change", () => stateText.textContent = input.checked ? "Enabled" : "Disabled");
                  row.appendChild(input); row.appendChild(stateText); fieldWrap.appendChild(row);
                } else {
                  input = document.createElement("input"); input.className = "home-input";
                  input.type = field.type === "number" ? "number" : field.type === "url" ? "url" : "text"; input.value = field.value == null ? "" : String(field.value);
                }
  
                if (input) {
                  input.dataset.pluginFieldId = field.id || field.label; input.dataset.pluginFieldType = field.type || "text";
                  if (field.placeholder && "placeholder" in input) input.placeholder = field.placeholder;
                  if (field.required && "required" in input) input.required = true;
  
                  const isLookup = field.type === "role-search" || field.type === "channel-search" || field.type === "member-search";
                  if (isLookup) { setupLookupField(field, input, fieldWrap); }
                  else if (field.type === "string-list") { setupStringListField(field, input, fieldWrap); }
                  else if (field.type !== "boolean") { fieldWrap.appendChild(input); }
                }
                fieldsWrap.appendChild(fieldWrap);
              });
              panelBody.appendChild(fieldsWrap);
            }
  
            if (panel.actions?.length) {
              const actions = document.createElement("div"); actions.className = "actions";
              panel.actions.forEach((action) => { actions.appendChild(makeButton(action, plugin.id, panel.id, panelBody)); });
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
  
        const homePath = state.selectedHomeCategoryId ? "/api/home?categoryId=" + encodeURIComponent(state.selectedHomeCategoryId) : "/api/home";
        const [home, overview, plugins] = await Promise.all([ fetchJson(buildApiUrl(homePath)), fetchJson(buildApiUrl("/api/overview")), fetchJson(buildApiUrl("/api/plugins")) ]);
  
        renderHomeSections(home.sections || []);
        const showOverviewArea = state.selectedHomeCategoryId === "overview";
        el.overviewArea.style.display = showOverviewArea ? "block" : "none";
        renderCards(overview.cards || []);
        renderPlugins(plugins.plugins || []);
      };
  
      const loadInitialData = async () => {
        const session = await fetchJson(dashboardConfig.basePath + "/api/session");
        if (!session.authenticated) { window.location.href = dashboardConfig.basePath + "/login"; return; }
  
        state.session = session;
        el.userMeta.textContent = session.user.username + " • " + session.guildCount + " guild(s)";
        const guilds = await fetchJson(dashboardConfig.basePath + "/api/guilds");
        state.guilds = guilds.guilds || [];
        state.selectedGuildId = null;
        renderServerRail(); updateContextLabel();
  
        el.tabHome.addEventListener("click", () => { state.activeMainTab = "home"; applyMainTab(); });
        el.tabPlugins.addEventListener("click", () => { state.activeMainTab = "plugins"; applyMainTab(); });
  
        applyMainTab(); await refreshContent();
      };
  
      loadInitialData().catch((error) => { el.userMeta.textContent = "Load failed"; console.error(error); });
    `;
}
