import { describe, expect, it } from "vitest";

import { ModuleLoader, ModuleLoaderError } from "../src/index.js";

const validModule = {
  contractVersion: "1.0.0",
  id: "example-module",
  name: "Örnek Branş Modülü",
  subjectIds: ["example-subject"],
  curriculum: [
    {
      schemaVersion: "1.0.0",
      id: "example-curriculum-2026",
      subjectId: "example-subject",
      title: "Örnek Müfredat",
      countryCode: "TR",
      languageTag: "tr-TR",
      version: "2026.1",
      status: "active",
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      source: {
        authority: "Örnek Yetkili Kurum",
        title: "Örnek Öğretim Programı",
        documentVersion: "2026",
        publishedAt: "2026-06-01",
      },
      gradeLevels: [{ id: "grade-10", label: "10. sınıf", sequence: 10 }],
      units: [
        {
          id: "unit-1",
          sequence: 1,
          title: "Örnek Ünite",
          gradeLevelIds: ["grade-10"],
          estimatedPeriods: 12,
          outcomeIds: ["outcome-1"],
        },
      ],
      outcomes: [
        {
          id: "outcome-1",
          code: "EX.10.1.1",
          unitId: "unit-1",
          title: "Örnek çıktı",
          description: "Öğrenci örnek çıktıyı gerçekleştirir.",
          gradeLevelIds: ["grade-10"],
          kind: "integrated",
          evidenceHints: [],
        },
      ],
    },
  ],
  assessment: [
    {
      id: "written-assessment",
      name: "Yazılı değerlendirme",
      supportedOutcomeKinds: ["knowledge", "skill", "integrated"],
    },
  ],
  documents: [
    {
      id: "daily-plan",
      name: "Günlük plan",
      formats: ["docx", "pdf"],
    },
  ],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "cite-curriculum",
        description: "Müfredat kararlarında kaynak göster.",
        effect: "require",
      },
    ],
  },
  reports: [
    {
      id: "outcome-report",
      name: "Öğrenme çıktısı raporu",
      requiredData: ["outcome-results"],
    },
  ],
} as const;

describe("Module Loader", () => {
  it("geçerli modülü kayıtlı ve sağlıklı olarak ekler", () => {
    const loader = new ModuleLoader();

    const snapshot = loader.register(validModule);

    expect(snapshot.status).toBe("registered");
    expect(snapshot.health.state).toBe("healthy");
  });

  it("units ve outcomes görünümlerini müfredattan türetir", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);

    const loaded = loader.get("example-module");

    expect(loaded.units.map((unit) => unit.id)).toEqual(["unit-1"]);
    expect(loaded.outcomes.map((outcome) => outcome.id)).toEqual(["outcome-1"]);
  });

  it("yüklenen modülü değişikliğe karşı dondurur", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);

    const loaded = loader.get("example-module");

    expect(Object.isFrozen(loaded)).toBe(true);
    expect(Object.isFrozen(loaded.curriculum)).toBe(true);
    expect(Object.isFrozen(loaded.curriculum[0])).toBe(true);
  });

  it("aynı kimlikle ikinci modülü reddeder", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);

    expect(() => loader.register(validModule)).toThrowError(
      expect.objectContaining<Partial<ModuleLoaderError>>({
        code: "DUPLICATE_MODULE",
      }),
    );
  });

  it("modülün tanımlamadığı branşa ait müfredatı reddeder", () => {
    const loader = new ModuleLoader();
    const invalid = structuredClone(validModule);
    invalid.subjectIds = ["another-subject"];

    expect(() => loader.register(invalid)).toThrow(/modül tarafından tanımlanmıyor/);
  });

  it("modülü etkinleştirir ve devre dışı bırakır", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);

    expect(loader.enable("example-module").status).toBe("enabled");
    expect(loader.disable("example-module").status).toBe("disabled");
  });

  it("sağlıksız modülü izole eder ve etkinleştirmez", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);

    const snapshot = loader.markUnhealthy(
      "example-module",
      "Başlangıç denetimi başarısız.",
    );

    expect(snapshot.status).toBe("error");
    expect(() => loader.enable("example-module")).toThrowError(
      expect.objectContaining<Partial<ModuleLoaderError>>({
        code: "MODULE_UNHEALTHY",
      }),
    );
  });

  it("sağlık onarımından sonra modülü devre dışı durumda hazırlar", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);
    loader.markUnhealthy("example-module", "Geçici hata");

    const snapshot = loader.markHealthy("example-module");

    expect(snapshot.health.state).toBe("healthy");
    expect(snapshot.status).toBe("disabled");
  });

  it("etkin modülün doğrudan kaldırılmasını engeller", () => {
    const loader = new ModuleLoader();
    loader.register(validModule);
    loader.enable("example-module");

    expect(() => loader.unregister("example-module")).toThrowError(
      expect.objectContaining<Partial<ModuleLoaderError>>({
        code: "MODULE_ENABLED",
      }),
    );
  });

  it("kayıtları kimliğe göre kararlı sıralar", () => {
    const loader = new ModuleLoader();
    loader.register({ ...validModule, id: "zeta-module" });
    loader.register({ ...validModule, id: "alpha-module" });

    expect(loader.list().map((module) => module.id)).toEqual([
      "alpha-module",
      "zeta-module",
    ]);
  });
});
