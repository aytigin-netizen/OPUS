import { ModuleLoader } from "@opus/core";
import { describe, expect, it } from "vitest";

import { foposModule } from "../src/index.js";

describe("FOPOS modül adaptörü", () => {
  it("Module Contract 1.0.0 ile doğrulanır ve yüklenir", () => {
    const loader = new ModuleLoader();

    const snapshot = loader.register(foposModule);

    expect(snapshot.status).toBe("registered");
    expect(snapshot.health.state).toBe("healthy");
    expect(loader.get("fopos").curriculum[0]?.subjectId).toBe("philosophy");
  });

  it("FOPOS 2024 kanonik kapsamını eksiksiz taşır", () => {
    const curriculum = foposModule.curriculum[0];

    expect(curriculum?.gradeLevels.map((grade) => grade.sequence)).toEqual([
      10, 11,
    ]);
    expect(curriculum?.units).toHaveLength(15);
    expect(curriculum?.outcomes).toHaveLength(22);
    expect(
      curriculum?.units.reduce(
        (total, unit) => total + unit.estimatedPeriods,
        0,
      ),
    ).toBe(136);
  });

  it("eski FOPOS kodlarını dış sistem uyumluluğu için korur", () => {
    const curriculum = foposModule.curriculum[0];

    expect(curriculum?.units[0]?.id).toBe("f10-u1");
    expect(curriculum?.outcomes[0]).toMatchObject({
      id: "fel-10-1-1",
      code: "FEL.10.1.1",
      unitId: "f10-u1",
    });
  });

  it("PDF satır sonlarından gelen eksik öğrenme çıktısı metinlerini reddeder", () => {
    const outcomes = foposModule.curriculum[0]?.outcomes;

    expect(
      outcomes?.find((outcome) => outcome.code === "FEL.10.6.1")?.description,
    ).toBe(
      "Estetik ve sanat felsefesinin konusunu, kavramlarını ve problemlerini muhakeme edebilme",
    );
    expect(
      outcomes?.find((outcome) => outcome.code === "FEL.10.8.1")?.description,
    ).toBe(
      "Din felsefesinin konusunu, kavramlarını ve problemlerini muhakeme edebilme",
    );
  });

  it("felsefeye özgü pedagojik AI sınırlarını modülde tutar", () => {
    expect(foposModule.ai_rules.rules.map((rule) => rule.id)).toEqual([
      "curriculum-first",
      "preserve-philosophical-plurality",
      "require-reasoning",
    ]);
  });
});
