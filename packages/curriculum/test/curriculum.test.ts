import { describe, expect, it } from "vitest";

import {
  createCurriculumIndex,
  isCurriculumEffectiveOn,
  parseCurriculum,
  validateCurriculum,
} from "../src/index.js";

const validCurriculum = {
  schemaVersion: "1.0.0",
  id: "example-curriculum-2026",
  subjectId: "example-subject",
  title: "Örnek Branştan Bağımsız Müfredat",
  countryCode: "tr",
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
    url: "https://example.edu/curriculum",
    retrievedAt: "2026-07-31",
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
      title: "Örnek öğrenme çıktısı",
      description: "Öğrenci örnek bir öğrenme çıktısını gerçekleştirir.",
      gradeLevelIds: ["grade-10"],
      kind: "integrated",
      evidenceHints: ["Gerekçeli kısa yanıt"],
    },
  ],
} as const;

describe("Curriculum Engine", () => {
  it("geçerli bir müfredatı ayrıştırır ve ülke kodunu normalleştirir", () => {
    const curriculum = parseCurriculum(validCurriculum);

    expect(curriculum.countryCode).toBe("TR");
    expect(curriculum.schemaVersion).toBe("1.0.0");
  });

  it("ünite ve öğrenme çıktısı indeksleri üretir", () => {
    const index = createCurriculumIndex(validCurriculum);

    expect(index.unitsById.get("unit-1")?.title).toBe("Örnek Ünite");
    expect(index.outcomesByCode.get("EX.10.1.1")?.id).toBe("outcome-1");
  });

  it("etkinlik tarih aralığını kapsayıcı değerlendirir", () => {
    const curriculum = parseCurriculum(validCurriculum);

    expect(isCurriculumEffectiveOn(curriculum, "2026-09-01")).toBe(true);
    expect(isCurriculumEffectiveOn(curriculum, "2026-08-31")).toBe(false);
  });

  it("tanımsız sınıf düzeyi referansını reddeder", () => {
    const invalid = structuredClone(validCurriculum);
    invalid.units[0].gradeLevelIds = ["grade-11"];

    const result = validateCurriculum(invalid);

    expect(result.success).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Tanımsız sınıf"))).toBe(
      true,
    );
  });

  it("ünite ile öğrenme çıktısının çift yönlü bağını zorunlu tutar", () => {
    const invalid = structuredClone(validCurriculum);
    invalid.units[0].outcomeIds = ["missing-outcome"];

    const result = validateCurriculum(invalid);

    expect(result.success).toBe(false);
    expect(
      result.issues.some((issue) =>
        issue.message.includes("Tanımsız öğrenme çıktısı"),
      ),
    ).toBe(true);
  });

  it("tekrarlanan öğrenme çıktısı kodlarını reddeder", () => {
    const invalid = structuredClone(validCurriculum);
    invalid.outcomes.push({
      ...invalid.outcomes[0],
      id: "outcome-2",
    });
    invalid.units[0].outcomeIds.push("outcome-2");

    const result = validateCurriculum(invalid);

    expect(result.success).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("kodu tekrar"))).toBe(
      true,
    );
  });

  it("geçersiz etkinlik tarih sırasını reddeder", () => {
    const invalid = {
      ...validCurriculum,
      effectiveTo: "2026-08-31",
    };

    const result = validateCurriculum(invalid);

    expect(result.success).toBe(false);
    expect(
      result.issues.some((issue) => issue.message.includes("Bitiş tarihi")),
    ).toBe(true);
  });
});
