import { describe, expect, it } from "vitest";

import {
  CurriculumService,
  CurriculumServiceError,
  ModuleLoader,
} from "../src/index.js";

const testModule = {
  contractVersion: "1.0.0",
  id: "test-module",
  name: "Test Modülü",
  subjectIds: ["test-subject"],
  curriculum: [
    {
      schemaVersion: "1.0.0",
      id: "test-curriculum",
      subjectId: "test-subject",
      title: "Test Müfredatı",
      countryCode: "TR",
      languageTag: "tr-TR",
      version: "1.0.0",
      status: "active",
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      source: {
        authority: "Test Kurumu",
        title: "Test Programı",
        documentVersion: "1",
        publishedAt: "2026-01-01",
      },
      gradeLevels: [
        { id: "grade-10", label: "10. sınıf", sequence: 10 },
        { id: "grade-11", label: "11. sınıf", sequence: 11 },
      ],
      units: [
        {
          id: "unit-10",
          sequence: 1,
          title: "10. sınıf ünitesi",
          gradeLevelIds: ["grade-10"],
          estimatedPeriods: 8,
          outcomeIds: ["outcome-10"],
        },
        {
          id: "unit-11",
          sequence: 2,
          title: "11. sınıf ünitesi",
          gradeLevelIds: ["grade-11"],
          estimatedPeriods: 8,
          outcomeIds: ["outcome-11"],
        },
        {
          id: "unit-shared",
          sequence: 3,
          title: "Ortak ünite",
          gradeLevelIds: ["grade-10", "grade-11"],
          estimatedPeriods: 8,
          outcomeIds: ["outcome-shared-10", "outcome-shared-11"],
        },
      ],
      outcomes: [
        {
          id: "outcome-10",
          code: "TEST.10.1",
          unitId: "unit-10",
          title: "10. sınıf çıktısı",
          description: "10. sınıf öğrenme çıktısı.",
          gradeLevelIds: ["grade-10"],
          kind: "integrated",
          evidenceHints: [],
        },
        {
          id: "outcome-11",
          code: "TEST.11.1",
          unitId: "unit-11",
          title: "11. sınıf çıktısı",
          description: "11. sınıf öğrenme çıktısı.",
          gradeLevelIds: ["grade-11"],
          kind: "integrated",
          evidenceHints: [],
        },
        {
          id: "outcome-shared-10",
          code: "TEST.SHARED.10",
          unitId: "unit-shared",
          title: "Ortak ünitenin 10. sınıf çıktısı",
          description: "Ortak ünitenin 10. sınıf öğrenme çıktısı.",
          gradeLevelIds: ["grade-10"],
          kind: "integrated",
          evidenceHints: [],
        },
        {
          id: "outcome-shared-11",
          code: "TEST.SHARED.11",
          unitId: "unit-shared",
          title: "Ortak ünitenin 11. sınıf çıktısı",
          description: "Ortak ünitenin 11. sınıf öğrenme çıktısı.",
          gradeLevelIds: ["grade-11"],
          kind: "integrated",
          evidenceHints: [],
        },
      ],
    },
  ],
  assessment: [
    {
      id: "test-assessment",
      name: "Test değerlendirmesi",
      supportedOutcomeKinds: ["integrated"],
    },
  ],
  documents: [],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "test-rule",
        description: "Test kuralı.",
        effect: "require",
      },
    ],
  },
  reports: [],
} as const;

function createService(enable = true): CurriculumService {
  const loader = new ModuleLoader();
  loader.register(testModule);
  if (enable) loader.enable(testModule.id);
  return new CurriculumService(loader);
}

describe("Curriculum Service", () => {
  it("yalnızca etkin modülden veri sunar", () => {
    const service = createService(false);

    expect(() =>
      service.listGradeLevels({
        moduleId: "test-module",
        curriculumId: "test-curriculum",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<CurriculumServiceError>>({
        code: "MODULE_NOT_ENABLED",
      }),
    );
  });

  it("sınıfa ait üniteleri filtreler", () => {
    const service = createService();

    expect(
      service
        .listUnits({
          moduleId: "test-module",
          curriculumId: "test-curriculum",
          gradeLevelId: "grade-11",
        })
        .map((unit) => unit.id),
    ).toEqual(["unit-11", "unit-shared"]);
  });

  it("ortak ünitede yalnızca istenen sınıfın çıktılarını listeler", () => {
    const service = createService();

    expect(
      service
        .listOutcomes({
          moduleId: "test-module",
          curriculumId: "test-curriculum",
          gradeLevelId: "grade-10",
          unitId: "unit-shared",
        })
        .map((outcome) => outcome.code),
    ).toEqual(["TEST.SHARED.10"]);
  });

  it("geçersiz sınıfı başka bir sınıfa dönüştürmez", () => {
    const service = createService();

    expect(() =>
      service.listUnits({
        moduleId: "test-module",
        curriculumId: "test-curriculum",
        gradeLevelId: "grade-12",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<CurriculumServiceError>>({
        code: "GRADE_LEVEL_NOT_FOUND",
      }),
    );
  });

  it("bulunmayan ünite yerine ilk üniteyi döndürmez", () => {
    const service = createService();

    expect(() =>
      service.getUnit({
        moduleId: "test-module",
        curriculumId: "test-curriculum",
        gradeLevelId: "grade-10",
        unitId: "missing-unit",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<CurriculumServiceError>>({
        code: "UNIT_NOT_FOUND",
      }),
    );
  });

  it("öğrenme çıktısının ünite bağını zorunlu tutar", () => {
    const service = createService();

    expect(() =>
      service.getOutcome({
        moduleId: "test-module",
        curriculumId: "test-curriculum",
        gradeLevelId: "grade-10",
        unitId: "unit-10",
        outcomeCode: "TEST.11.1",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<CurriculumServiceError>>({
        code: "OUTCOME_UNIT_MISMATCH",
      }),
    );
  });
});
