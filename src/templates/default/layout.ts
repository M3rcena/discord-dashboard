export const defaultAppCss = `
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

export function renderDefaultLayoutBody(safeName: string): string {
	return `<div class="layout">
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
	</div>`;
}

export function renderDefaultLayoutDocument(input: {
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

	<script>
${input.script}
	</script>
</body>
</html>`;
}
