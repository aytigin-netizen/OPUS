import { ModuleLoader } from "@opus/core";
import { describe, expect, it } from "vitest";

import { logoposModule } from "../src/index.js";

describe("LOGOPOS modül temeli", () => {
  it("Module Contract 1.0.0 ile doğrulanır ve yüklenir", () => {
    const loader = new ModuleLoader();
    const registered = loader.register(logoposModule);
    const enabled = loader.enable(logoposModule.id);

    expect(registered.status).toBe("registered");
    expect(enabled.status).toBe("enabled");
    expect(enabled.subjectIds).toEqual(["logic"]);
  });

  it("resmî 2026 programının tek ortaöğretim bağlamını ve kaynağını korur", () => {
    const curriculum = logoposModule.curriculum[0];

    expect(curriculum?.id).toBe("logic-tr-2026");
    expect(curriculum?.gradeLevels).toEqual([
      { id: "secondary-education", label: "Ortaöğretim", sequence: 0 },
    ]);
    expect(curriculum?.source.url).toBe(
      "https://mufredat.meb.gov.tr/ProgramDetay.aspx?PID=2172",
    );
    expect(curriculum?.source.publishedAt).toBe("2026-06-25");
  });

  it("4 ünite, 17 öğrenme çıktısı ve 68 ünite ders saatini aktarır", () => {
    const curriculum = logoposModule.curriculum[0];

    expect(curriculum?.units).toHaveLength(4);
    expect(curriculum?.outcomes).toHaveLength(17);
    expect(curriculum?.units.map((unit) => unit.estimatedPeriods)).toEqual([
      10, 16, 16, 26,
    ]);
    expect(
      curriculum?.units.reduce(
        (total, unit) => total + unit.estimatedPeriods,
        0,
      ),
    ).toBe(68);
  });

  it("resmî öğrenme çıktısı kodlarını ve ünite sahipliğini korur", () => {
    const curriculum = logoposModule.curriculum[0];

    expect(curriculum?.outcomes.map((outcome) => outcome.code)).toEqual([
      "MAN.1.1", "MAN.1.2", "MAN.1.3",
      "MAN.2.1", "MAN.2.2", "MAN.2.3",
      "MAN.3.1", "MAN.3.2", "MAN.3.3", "MAN.3.4", "MAN.3.5",
      "MAN.4.1", "MAN.4.2", "MAN.4.3", "MAN.4.4", "MAN.4.5", "MAN.4.6",
    ]);
    expect(curriculum?.units.map((unit) => unit.outcomeIds.length)).toEqual([
      3, 3, 5, 6,
    ]);
  });

  it("mantığa özgü doğruluk, geçerlilik ve formel anlam kurallarını modül içinde tutar", () => {
    expect(logoposModule.ai_rules.rules.map((rule) => rule.id)).toEqual([
      "curriculum-first",
      "preserve-formal-meaning",
      "show-reasoning-steps",
      "separate-validity-and-truth",
    ]);
  });
});
