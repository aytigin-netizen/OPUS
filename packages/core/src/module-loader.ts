import {
  collectOutcomes,
  collectUnits,
  parseOpusModule,
  type LoadedModule,
  type OpusModule,
} from "./module-contract.js";

export type ModuleStatus = "registered" | "enabled" | "disabled" | "error";
export type ModuleHealth =
  | { readonly state: "healthy" }
  | { readonly state: "unhealthy"; readonly reason: string };

export interface ModuleSnapshot {
  readonly id: string;
  readonly name: string;
  readonly contractVersion: "1.0.0";
  readonly status: ModuleStatus;
  readonly health: ModuleHealth;
  readonly subjectIds: readonly string[];
}

interface ModuleRecord {
  module: LoadedModule;
  status: ModuleStatus;
  health: ModuleHealth;
}

export type ModuleLoaderErrorCode =
  | "DUPLICATE_MODULE"
  | "MODULE_NOT_FOUND"
  | "MODULE_UNHEALTHY"
  | "MODULE_ENABLED";

export class ModuleLoaderError extends Error {
  readonly code: ModuleLoaderErrorCode;

  constructor(code: ModuleLoaderErrorCode, message: string) {
    super(message);
    this.name = "ModuleLoaderError";
    this.code = code;
  }
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach((nested) => deepFreeze(nested));
  return value;
}

function toLoadedModule(module: OpusModule): LoadedModule {
  return deepFreeze({
    ...module,
    units: collectUnits(module.curriculum),
    outcomes: collectOutcomes(module.curriculum),
  });
}

function toSnapshot(record: ModuleRecord): ModuleSnapshot {
  return Object.freeze({
    id: record.module.id,
    name: record.module.name,
    contractVersion: record.module.contractVersion,
    status: record.status,
    health: record.health,
    subjectIds: record.module.subjectIds,
  });
}

export class ModuleLoader {
  readonly #records = new Map<string, ModuleRecord>();

  register(input: unknown): ModuleSnapshot {
    const parsed = parseOpusModule(input);

    if (this.#records.has(parsed.id)) {
      throw new ModuleLoaderError(
        "DUPLICATE_MODULE",
        `Modül zaten kayıtlı: ${parsed.id}`,
      );
    }

    const record: ModuleRecord = {
      module: toLoadedModule(parsed),
      status: "registered",
      health: { state: "healthy" },
    };
    this.#records.set(parsed.id, record);
    return toSnapshot(record);
  }

  unregister(moduleId: string): void {
    const record = this.#requireRecord(moduleId);

    if (record.status === "enabled") {
      throw new ModuleLoaderError(
        "MODULE_ENABLED",
        `Etkin modül önce devre dışı bırakılmalıdır: ${moduleId}`,
      );
    }

    this.#records.delete(moduleId);
  }

  enable(moduleId: string): ModuleSnapshot {
    const record = this.#requireRecord(moduleId);

    if (record.health.state === "unhealthy") {
      throw new ModuleLoaderError(
        "MODULE_UNHEALTHY",
        `Sağlıksız modül etkinleştirilemez: ${moduleId}`,
      );
    }

    record.status = "enabled";
    return toSnapshot(record);
  }

  disable(moduleId: string): ModuleSnapshot {
    const record = this.#requireRecord(moduleId);
    record.status = "disabled";
    return toSnapshot(record);
  }

  markUnhealthy(moduleId: string, reason: string): ModuleSnapshot {
    const record = this.#requireRecord(moduleId);
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      throw new TypeError("Sağlık hatası gerekçesi boş olamaz.");
    }

    record.health = { state: "unhealthy", reason: normalizedReason };
    record.status = "error";
    return toSnapshot(record);
  }

  markHealthy(moduleId: string): ModuleSnapshot {
    const record = this.#requireRecord(moduleId);
    record.health = { state: "healthy" };
    record.status = "disabled";
    return toSnapshot(record);
  }

  get(moduleId: string): LoadedModule {
    return this.#requireRecord(moduleId).module;
  }

  getSnapshot(moduleId: string): ModuleSnapshot {
    return toSnapshot(this.#requireRecord(moduleId));
  }

  list(): readonly ModuleSnapshot[] {
    return Object.freeze(
      [...this.#records.values()]
        .map(toSnapshot)
        .sort((left, right) => left.id.localeCompare(right.id)),
    );
  }

  #requireRecord(moduleId: string): ModuleRecord {
    const record = this.#records.get(moduleId);

    if (!record) {
      throw new ModuleLoaderError(
        "MODULE_NOT_FOUND",
        `Modül bulunamadı: ${moduleId}`,
      );
    }

    return record;
  }
}
