import { BuiltinLayouts } from "../templates";
import { BuiltinThemes } from "../templates/themes";
import type { DashboardDesignConfig, DashboardOptions, DashboardTemplateRenderContext, DashboardTemplateRenderer } from "../Types";

export class TemplateManager {
  private layoutRenderer: DashboardTemplateRenderer;
  private resolvedDesign: DashboardDesignConfig;

  constructor(options: DashboardOptions) {
    this.layoutRenderer = this.resolveLayout(options.uiTemplate);
    this.resolvedDesign = this.resolveTheme(options.uiTheme, options.setupDesign);
  }

  private resolveLayout(layoutInput?: string | DashboardTemplateRenderer): DashboardTemplateRenderer {
    if (typeof layoutInput === "function") {
      return layoutInput;
    }

    if (typeof layoutInput === "string" && BuiltinLayouts[layoutInput]) {
      return BuiltinLayouts[layoutInput];
    }

    return BuiltinLayouts["default"];
  }

  private resolveTheme(themeInput?: string | DashboardDesignConfig, customOverrides?: DashboardDesignConfig): DashboardDesignConfig {
    let baseTheme: DashboardDesignConfig = {};

    if (typeof themeInput === "string" && BuiltinThemes[themeInput]) {
      baseTheme = BuiltinThemes[themeInput];
    } else if (typeof themeInput === "object") {
      baseTheme = themeInput;
    }

    const merged: DashboardDesignConfig = {
      ...baseTheme,
      ...customOverrides,
    };

    const combinedCss = [baseTheme.customCss, customOverrides?.customCss].filter((css) => css && css.trim().length > 0).join("\n\n");

    if (combinedCss) {
      merged.customCss = combinedCss;
    }

    return merged;
  }

  public render(contextBase: Omit<DashboardTemplateRenderContext, "setupDesign">): string {
    const finalContext: DashboardTemplateRenderContext = {
      ...contextBase,
      setupDesign: this.resolvedDesign,
    };

    return this.layoutRenderer(finalContext);
  }
}
