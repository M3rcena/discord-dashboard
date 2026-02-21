import { mkdir, readFile, writeFile } from "node:fs/promises";

export interface DemoStateMeta {
  saveCount: number;
  lastAction: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

export interface DemoUserState {
  profileBio: string;
  petsEnabled: boolean;
  favoritePetName: string;
  petNotifications: boolean;
  updatedAt?: string;
}

export interface DemoGuildState {
  prefix: string;
  moderationEnabled: boolean;
  logChannelId: string;
  welcomeChannelId: string;
  pollButtons: string[];
  pollMessage: string;
  lastCommandAt?: string;
  lastEventAt?: string;
  lastEvent?: string;
  updatedAt?: string;
}

export interface DemoState {
  meta: DemoStateMeta;
  users: Record<string, DemoUserState>;
  guilds: Record<string, DemoGuildState>;
}

export interface DemoStateStore {
  filePath: string;
  init: () => Promise<void>;
  read: () => Promise<DemoState>;
  update: (
    action: string,
    actor: string,
    mutator: (state: DemoState) => void | Promise<void>
  ) => Promise<void>;
  getUserState: (userId: string) => Promise<DemoUserState>;
  getGuildState: (guildId: string) => Promise<DemoGuildState>;
}

const defaultState: DemoState = {
  meta: {
    saveCount: 0,
    lastAction: "No actions yet",
    lastUpdatedAt: new Date(0).toISOString(),
    lastUpdatedBy: "system"
  },
  users: {},
  guilds: {}
};

const defaultUserState: DemoUserState = {
  profileBio: "",
  petsEnabled: true,
  favoritePetName: "Luna",
  petNotifications: true
};

const defaultGuildState: DemoGuildState = {
  prefix: "!",
  moderationEnabled: true,
  logChannelId: "",
  welcomeChannelId: "",
  pollButtons: ["✅ Yes", "❌ No"],
  pollMessage: "What should we do for the next event?"
};

function normalizeState(input: Partial<DemoState>): DemoState {
  return {
    meta: {
      saveCount: Number(input.meta?.saveCount ?? 0),
      lastAction: String(input.meta?.lastAction ?? "No actions yet"),
      lastUpdatedAt: String(input.meta?.lastUpdatedAt ?? new Date(0).toISOString()),
      lastUpdatedBy: String(input.meta?.lastUpdatedBy ?? "system")
    },
    users: input.users ?? {},
    guilds: input.guilds ?? {}
  };
}

export function createDemoStateStore(fileUrl: URL): DemoStateStore {
  let writeQueue: Promise<void> = Promise.resolve();

  const read = async (): Promise<DemoState> => {
    try {
      const raw = await readFile(fileUrl, "utf8");
      return normalizeState(JSON.parse(raw) as Partial<DemoState>);
    } catch {
      return structuredClone(defaultState);
    }
  };

  const write = async (state: DemoState): Promise<void> => {
    await writeFile(fileUrl, JSON.stringify(state, null, 2), "utf8");
  };

  return {
    filePath: fileUrl.pathname,
    async init(): Promise<void> {
      await mkdir(new URL(".", fileUrl), { recursive: true });
      try {
        await readFile(fileUrl, "utf8");
      } catch {
        await write(structuredClone(defaultState));
      }
    },
    read,
    async update(action, actor, mutator): Promise<void> {
      writeQueue = writeQueue.then(async () => {
        const state = await read();
        await mutator(state);
        state.meta.saveCount += 1;
        state.meta.lastAction = action;
        state.meta.lastUpdatedBy = actor;
        state.meta.lastUpdatedAt = new Date().toISOString();
        await write(state);
      });

      await writeQueue;
    },
    async getUserState(userId): Promise<DemoUserState> {
      const state = await read();
      return {
        ...defaultUserState,
        ...(state.users[userId] ?? {})
      };
    },
    async getGuildState(guildId): Promise<DemoGuildState> {
      const state = await read();
      return {
        ...defaultGuildState,
        ...(state.guilds[guildId] ?? {})
      };
    }
  };
}
