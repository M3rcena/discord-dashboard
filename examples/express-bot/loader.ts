import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import type { BotCommand, BotEvent } from "./types";

const supportedModuleExtensions = new Set([".ts", ".js", ".mjs", ".mts", ".cjs", ".cts"]);

async function loadModulesFromDir<T>(directoryUrl: URL): Promise<T[]> {
  const directoryPath = fileURLToPath(directoryUrl);
  const files = await readdir(directoryPath, { withFileTypes: true });
  const modules: T[] = [];

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    const extension = file.name.slice(file.name.lastIndexOf("."));
    if (!supportedModuleExtensions.has(extension)) {
      continue;
    }

    const filePath = join(directoryPath, file.name);
    const imported = await import(pathToFileURL(filePath).href);
    const target = (imported.default ?? imported) as T;
    modules.push(target);
  }

  return modules;
}

export async function loadCommands(directoryUrl: URL): Promise<Map<string, BotCommand>> {
  const modules = await loadModulesFromDir<BotCommand>(directoryUrl);
  const commands = new Map<string, BotCommand>();

  for (const command of modules) {
    if (!command?.data?.name || typeof command.execute !== "function") {
      continue;
    }

    commands.set(command.data.name, command);
  }

  return commands;
}

export async function loadEvents(directoryUrl: URL): Promise<BotEvent[]> {
  const modules = await loadModulesFromDir<BotEvent>(directoryUrl);
  return modules.filter((event) => Boolean(event?.name) && typeof event.execute === "function");
}
