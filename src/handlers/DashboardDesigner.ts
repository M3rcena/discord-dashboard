import type { DashboardAction, DashboardCategory, DashboardDesignConfig, DashboardField, DashboardOptions, DashboardTemplateRenderer } from "../Types";

export class CategoryBuilder {
  public data: DashboardCategory;

  constructor(id: string, label: string) {
    this.data = { id, label };
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }
}

export class SectionBuilder {
  public data: any = { fields: [], actions: [] };

  constructor(
    public id: string,
    public categoryId: string,
    public title: string,
  ) {
    this.data.id = id;
    this.data.categoryId = categoryId;
    this.data.title = title;
    this.data.width = 100;
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  public setWidth(width: 20 | 33 | 50 | 100) {
    this.data.width = width;
    return this;
  }

  public addField(field: DashboardField) {
    this.data.fields.push(field);
    return this;
  }

  public addAction(id: string, label: string, options?: { variant?: "primary" | "danger" | "default"; collectFields?: boolean }, handler?: DashboardAction["handler"]) {
    this.data.actions.push({ id, label, ...options, handler });
    return this;
  }
}

export class PanelBuilder {
  public data: any = { fields: [], actions: [] };

  constructor(
    public id: string,
    public title: string,
  ) {
    this.data.id = id;
    this.data.title = title;
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  public addField(field: DashboardField) {
    this.data.fields.push(field);
    return this;
  }

  public addAction(id: string, label: string, options?: { variant?: "primary" | "danger" | "default"; collectFields?: boolean }, handler?: DashboardAction["handler"]) {
    this.data.actions.push({ id, label, ...options, handler });
    return this;
  }
}

export class PluginBuilder {
  public data: any = { panels: [] };

  constructor(
    public id: string,
    public name: string,
  ) {
    this.data.id = id;
    this.data.name = name;
  }

  public setDescription(description: string) {
    this.data.description = description;
    return this;
  }

  public addPanel(panel: PanelBuilder) {
    this.data.panels.push(panel.data);
    return this;
  }
}

export class DashboardDesigner {
  private config: Partial<DashboardOptions> = {
    setupDesign: {},
    uiTemplates: {},
  };

  private categories: DashboardCategory[] = [];
  private sections: any[] = [];
  private plugins: any[] = [];
  private overviewCards: { title: string; value: string; subtitle?: string }[] = [];

  constructor(dashboardName?: string) {
    if (dashboardName) {
      this.config.dashboardName = dashboardName;
    }
  }

  public setLayout(template: DashboardOptions["uiTemplate"]) {
    this.config.uiTemplate = template;
    return this;
  }

  public setTheme(theme: DashboardOptions["uiTheme"]) {
    this.config.uiTheme = theme;
    return this;
  }

  public setColors(colors: DashboardDesignConfig) {
    this.config.setupDesign = { ...this.config.setupDesign, ...colors };
    return this;
  }

  public setCustomCss(css: string) {
    this.config.setupDesign!.customCss = css;
    return this;
  }

  public registerCustomLayout(name: string, renderer: DashboardTemplateRenderer) {
    this.config.uiTemplates![name] = renderer;
    return this;
  }

  // --- Content Building Methods ---

  public addOverviewCard(title: string, value: string, subtitle?: string) {
    this.overviewCards.push({ title, value, subtitle });
    return this;
  }

  public addCategory(category: CategoryBuilder) {
    this.categories.push(category.data);
    return this;
  }

  public addSection(section: SectionBuilder) {
    this.sections.push(section.data);
    return this;
  }

  public addPlugin(plugin: PluginBuilder) {
    this.plugins.push(plugin.data);
    return this;
  }
  public build(): Partial<DashboardOptions> {
    return {
      ...this.config,
      dashboardData: {
        categories: this.categories,
        sections: this.sections,
        plugins: this.plugins,
        overviewCards: this.overviewCards,
      },
    };
  }
}
