import type { DashboardOptions, DashboardTemplateRenderer } from "../Types";
import { defaultDashboardTemplateRenderer } from "../templates/default";
import { getBuiltinTemplateRenderer } from "../templates";

export class TemplateManager {
    private readonly selectedTemplate: string;
    private readonly options: DashboardOptions;

    constructor(options: DashboardOptions) {
        this.options = options;
        this.selectedTemplate = options.uiTemplate ?? "default";
    }

    public getTemplateId(): string {
        return this.selectedTemplate;
    }

    public resolveRenderer(): DashboardTemplateRenderer {
        const customRenderer = this.options.uiTemplates?.[this.selectedTemplate];
        if (customRenderer) return customRenderer;

        const builtinRenderer = getBuiltinTemplateRenderer(this.selectedTemplate);
        if (builtinRenderer) return builtinRenderer;

        if (this.selectedTemplate !== "default") {
            throw new Error(`Unknown uiTemplate '${this.selectedTemplate}'. Register it in uiTemplates.`);
        }

        return defaultDashboardTemplateRenderer;
    }
}