import { ModuleLoader } from "@opus/core";
import { describe, expect, it } from "vitest";

import {
  createPsyoposCurriculumAdapter,
  psyoposModule,
} from "../src/index.js";

describe("PSYOPOS modül temeli", () => {
  it("Module Contract 1.0.0 ile doğrulanır ve yüklenir", () => {
    const loader = new ModuleLoader();
    const registered = loader.register(psyoposModule);
    const enabled = loader.enable(psyoposModule.id);

    expect(registered.status).toBe("registered");
    expect(enabled.status).toBe("enabled");
    expect(enabled.subjectIds).toEqual(["psychology"]);
  });

  it("resmî 2026 programının tek ortaöğretim bağlamını korur", () => {
    const curriculum = psyoposModule.curriculum[0];

    expect(curriculum?.id).toBe("psychology-tr-2026");
    expect(curriculum?.gradeLevels).toEqual([
      { id: "secondary-education", label: "Ortaöğretim", sequence: 0 },
    ]);
    expect(curriculum?.source.url).toBe(
      "https://mufredat.meb.gov.tr/ProgramDetay.aspx?PID=2170",
    );
    expect(curriculum?.source.publishedAt).toBe("2026-06-25");
  });

  it("4 ünite, 13 öğrenme çıktısı ve 68 ünite ders saatini aktarır", () => {
    const curriculum = psyoposModule.curriculum[0];

    expect(curriculum?.units).toHaveLength(4);
    expect(curriculum?.outcomes).toHaveLength(13);
    expect(
      curriculum?.units.reduce(
        (total, unit) => total + unit.estimatedPeriods,
        0,
      ),
    ).toBe(68);
    expect(curriculum?.units.map((unit) => unit.estimatedPeriods)).toEqual([
      10, 18, 20, 20,
    ]);
  });

  it("resmî öğrenme çıktısı kodlarını ve ünite sahipliğini korur", () => {
    const curriculum = psyoposModule.curriculum[0];

    expect(curriculum?.outcomes.map((outcome) => outcome.code)).toEqual([
      "PSK.1.1",
      "PSK.2.1",
      "PSK.2.2",
      "PSK.2.3",
      "PSK.2.4",
      "PSK.3.1",
      "PSK.3.2",
      "PSK.3.3",
      "PSK.3.4",
      "PSK.4.1",
      "PSK.4.2",
      "PSK.4.3",
      "PSK.4.4",
    ]);
    expect(
      curriculum?.units.map((unit) => unit.outcomeIds.length),
    ).toEqual([1, 4, 4, 4]);
  });

  it("psikolojik tanı ve mahremiyet sınırlarını modül içinde tutar", () => {
    expect(psyoposModule.ai_rules.rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "forbid-automated-diagnosis",
          effect: "forbid",
        }),
        expect.objectContaining({
          id: "protect-psychological-privacy",
          effect: "forbid",
        }),
      ]),
    );
  });

  it("PSYOPOS seçimlerini Core Curriculum Service üzerinden çözer", () => {
    const curriculum = createPsyoposCurriculumAdapter();

    expect(curriculum.getEducationLevel()).toEqual({
      id: "secondary-education",
      label: "Ortaöğretim",
      sequence: 0,
    });
    expect(curriculum.listUnits().map((unit) => unit.id)).toEqual([
      "psk-u1",
      "psk-u2",
      "psk-u3",
      "psk-u4",
    ]);
    expect(curriculum.getUnit("psk-u2").title).toBe("GELİŞİMİ ANLAMAK");
    expect(curriculum.listOutcomes("psk-u2")).toHaveLength(4);
    expect(curriculum.getOutcome("psk-u2", "PSK.2.3").title).toBe(
      "İnsan zekâsı ile yapay zekâyı karşılaştırabilme",
    );
  });

  it("yanlış ünite ve öğrenme çıktısında sessiz geri dönüş yapmaz", () => {
    const curriculum = createPsyoposCurriculumAdapter();

    expect(() => curriculum.getUnit("psk-u5")).toThrow(
      /secondary-education sınıf düzeyinde bulunamadı/,
    );
    expect(() =>
      curriculum.getOutcome("psk-u1", "PSK.2.1"),
    ).toThrow(/psk-u1 ünitesine ait değil/);
    expect(() =>
      curriculum.getOutcome("psk-u1", "PSK.9.9"),
    ).toThrow(/Öğrenme çıktısı bulunamadı/);
  });
});
