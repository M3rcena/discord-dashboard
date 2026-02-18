import type {
  DashboardHomeBuilder,
  DashboardContext,
  DashboardOptions,
  DashboardScope,
  DashboardTemplateRenderer,
  HomeActionPayload,
  HomeCategory,
  HomeSection,
  HomeSectionAction,
  HomeSectionField,
  PluginActionResult
} from "./types";

type HomeActionHandler = (
  context: DashboardContext,
  payload: HomeActionPayload
) => Promise<PluginActionResult> | PluginActionResult;

type HomeLoadHandler = (
  context: DashboardContext,
  section: HomeSection
) => Promise<Partial<HomeSection> | HomeSection | void> | Partial<HomeSection> | HomeSection | void;

interface DesignerPageDefinition {
  pageId: string;
  category: HomeCategory;
  section: HomeSection;
}

class CategoryBuilder {
  private sections: HomeSection[] = [];

  constructor(
    private readonly scope: DashboardScope,
    private readonly categoryId: string,
    private readonly categoryLabel: string
  ) {}

  section(input: {
    id: string;
    title: string;
    description?: string;
    width?: 100 | 50 | 33 | 20;
    fields?: HomeSectionField[];
    actions?: HomeSectionAction[];
  }): this {
    this.sections.push({
      id: input.id,
      title: input.title,
      description: input.description,
      width: input.width,
      fields: input.fields ?? [],
      actions: input.actions ?? [],
      scope: this.scope,
      categoryId: this.categoryId
    });

    return this;
  }

  buildCategory(): HomeCategory {
    return {
      id: this.categoryId,
      label: this.categoryLabel,
      scope: this.scope
    };
  }

  buildSections(): HomeSection[] {
    return [...this.sections];
  }
}

export class DashboardDesigner {
  private readonly partialOptions: Partial<DashboardOptions>;
  private readonly categories: CategoryBuilder[] = [];
  private readonly pages: DesignerPageDefinition[] = [];
  private readonly homeActions: Record<string, HomeActionHandler> = {};
  private readonly loadHandlers: Record<string, HomeLoadHandler> = {};
  private readonly saveHandlers: Record<string, HomeActionHandler> = {};

  constructor(baseOptions: Omit<DashboardOptions, "home">) {
    this.partialOptions = { ...baseOptions };
  }

  setup(input: {
    ownerIds?: string[];
    botInvitePermissions?: string;
    botInviteScopes?: string[];
    dashboardName?: string;
    basePath?: string;
    uiTemplate?: string;
  }): this {
    if (input.ownerIds) this.partialOptions.ownerIds = input.ownerIds;
    if (input.botInvitePermissions) this.partialOptions.botInvitePermissions = input.botInvitePermissions;
    if (input.botInviteScopes) this.partialOptions.botInviteScopes = input.botInviteScopes;
    if (input.dashboardName) this.partialOptions.dashboardName = input.dashboardName;
    if (input.basePath) this.partialOptions.basePath = input.basePath;
    if (input.uiTemplate) this.partialOptions.uiTemplate = input.uiTemplate;
    return this;
  }

  useTemplate(templateId: string): this {
    this.partialOptions.uiTemplate = templateId;
    return this;
  }

  addTemplate(templateId: string, renderer: DashboardTemplateRenderer): this {
    this.partialOptions.uiTemplates = {
      ...(this.partialOptions.uiTemplates ?? {}),
      [templateId]: renderer
    };

    return this;
  }

  setupDesign(input: {
    bg?: string;
    rail?: string;
    contentBg?: string;
    panel?: string;
    panel2?: string;
    text?: string;
    muted?: string;
    primary?: string;
    success?: string;
    warning?: string;
    danger?: string;
    info?: string;
    border?: string;
  }): this {
    this.partialOptions.setupDesign = {
      ...(this.partialOptions.setupDesign ?? {}),
      ...input
    };

    return this;
  }

  userCategory(categoryId: string, categoryLabel: string, build: (builder: CategoryBuilder) => void): this {
    const builder = new CategoryBuilder("user", categoryId, categoryLabel);
    build(builder);
    this.categories.push(builder);
    return this;
  }

  guildCategory(categoryId: string, categoryLabel: string, build: (builder: CategoryBuilder) => void): this {
    const builder = new CategoryBuilder("guild", categoryId, categoryLabel);
    build(builder);
    this.categories.push(builder);
    return this;
  }

  setupCategory(categoryId: string, categoryLabel: string, build: (builder: CategoryBuilder) => void): this {
    const builder = new CategoryBuilder("setup", categoryId, categoryLabel);
    build(builder);
    this.categories.push(builder);
    return this;
  }

  setupPage(input: {
    id: string;
    title: string;
    label?: string;
    scope?: DashboardScope;
    categoryId?: string;
    description?: string;
    width?: 100 | 50 | 33 | 20;
    fields?: HomeSectionField[];
    actions?: HomeSectionAction[];
  }): this {
    const scope = input.scope ?? "user";
    const categoryId = input.categoryId ?? input.id;

    this.pages.push({
      pageId: input.id,
      category: {
        id: categoryId,
        label: input.label ?? input.title,
        scope
      },
      section: {
        id: input.id,
        title: input.title,
        description: input.description,
        width: input.width,
        scope,
        categoryId,
        fields: input.fields ?? [],
        actions: input.actions ?? []
      }
    });

    return this;
  }

  onHomeAction(actionId: string, handler: HomeActionHandler): this {
    this.homeActions[actionId] = handler;
    return this;
  }

  onLoad(pageId: string, handler: HomeLoadHandler): this {
    this.loadHandlers[pageId] = handler;
    return this;
  }

  onload(pageId: string, handler: HomeLoadHandler): this {
    return this.onLoad(pageId, handler);
  }

  onSave(pageId: string, handler: HomeActionHandler): this {
    this.saveHandlers[pageId] = handler;
    return this;
  }

  onsave(pageId: string, handler: HomeActionHandler): this {
    return this.onSave(pageId, handler);
  }

  build(): DashboardOptions {
    const staticCategories = this.categories.map((item) => item.buildCategory());
    const staticSections = this.categories.flatMap((item) => item.buildSections());
    const pageCategories = this.pages.map((item) => item.category);
    const baseSections = [...staticSections, ...this.pages.map((item) => item.section)];

    const categoryMap = new Map<string, HomeCategory>();
    for (const category of [...staticCategories, ...pageCategories]) {
      const key = `${category.scope}:${category.id}`;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, category);
      }
    }

    const categories = [...categoryMap.values()];
    const saveActionIds: Record<string, string> = {};
    for (const section of baseSections) {
      if (this.saveHandlers[section.id]) {
        saveActionIds[section.id] = `save:${section.id}`;
      }
    }

    const resolvedActions: Record<string, HomeActionHandler> = {
      ...this.homeActions
    };

    for (const [sectionId, handler] of Object.entries(this.saveHandlers)) {
      resolvedActions[saveActionIds[sectionId]] = handler;
    }

    const home: DashboardHomeBuilder = {
      getCategories: () => categories,
      getSections: async (context) => {
        const sections: HomeSection[] = [];

        for (const sourceSection of baseSections) {
          let section: HomeSection = {
            ...sourceSection,
            fields: sourceSection.fields ? [...sourceSection.fields] : [],
            actions: sourceSection.actions ? [...sourceSection.actions] : []
          };

          const saveActionId = saveActionIds[section.id];
          if (saveActionId && !section.actions?.some((action) => action.id === saveActionId)) {
            section.actions = [...(section.actions ?? []), {
              id: saveActionId,
              label: "Save",
              variant: "primary"
            }];
          }

          const loadHandler = this.loadHandlers[section.id];
          if (loadHandler) {
            const loaded = await loadHandler(context, section);
            if (loaded) {
              section = {
                ...section,
                ...loaded,
                fields: loaded.fields ?? section.fields,
                actions: loaded.actions ?? section.actions
              };
            }
          }

          sections.push(section);
        }

        return sections;
      },
      actions: resolvedActions as DashboardHomeBuilder["actions"]
    };

    return {
      ...(this.partialOptions as DashboardOptions),
      home
    };
  }
}

export function createDashboardDesigner(baseOptions: Omit<DashboardOptions, "home">): DashboardDesigner {
  return new DashboardDesigner(baseOptions);
}
