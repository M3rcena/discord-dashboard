export interface DashboardOverviewCard {
  title: string;
  value: string;
  subtitle?: string;
}

export interface DashboardCategory {
  id: string;
  label: string;
  description?: string;
}

export interface DashboardAction {
  id: string;
  label: string;
  variant?: "primary" | "danger" | "default";
  collectFields?: boolean;
  handler?: (context: unknown, values: Record<string, unknown>) => Promise<{ message?: string; refresh?: boolean }> | { message?: string; refresh?: boolean };
}

export interface DashboardField {
  id: string;
  label: string;
  type: "text" | "number" | "boolean" | "textarea" | "select" | "string-list" | "role-search" | "channel-search" | "member-search" | "url";
  value?: unknown;
  placeholder?: string;
  required?: boolean;
  readOnly?: boolean;
  editable?: boolean;
  options?: { label: string; value: string }[];
  lookup?: {
    minQueryLength?: number;
    limit?: number;
    includeManaged?: boolean;
    nsfw?: boolean;
    channelTypes?: number[];
  };
}

export interface DashboardSection {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  width: 20 | 33 | 50 | 100;
  fields: DashboardField[];
  actions: DashboardAction[];
}

export interface DashboardPanel {
  id: string;
  title: string;
  description?: string;
  fields: DashboardField[];
  actions: DashboardAction[];
}

export interface DashboardPluginData {
  id: string;
  name: string;
  description?: string;
  panels: DashboardPanel[];
}

export interface DashboardData {
  categories: DashboardCategory[];
  sections: DashboardSection[];
  plugins: DashboardPluginData[];
  overviewCards: DashboardOverviewCard[];
}
