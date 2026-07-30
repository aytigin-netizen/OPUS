import { describe, expect, it } from "vitest";

import {
  CurriculumService,
  ModuleLoader,
  PedagogicalDecisionError,
  PedagogicalDecisionService,
} from "../src/index.js";

const moduleDefinition = {
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
      gradeLevels: [{ id: "grade-10", label: "10. sınıf", sequence: 10 }],
      units: [
        {
          id: "unit-1",
          sequence: 1,
          title: "Test ünitesi",
          gradeLevelIds: ["grade-10"],
          estimatedPeriods: 8,
          outcomeIds: ["outcome-1"],
        },
      ],
      outcomes: [
        {
          id: "outcome-1",
          code: "TEST.10.1",
          unitId: "unit-1",
          title: "Test çıktısı",
          description: "Test öğrenme çıktısı.",
          gradeLevelIds: ["grade-10"],
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
        description: "Test modülünün pedagojik kuralı.",
        effect: "require",
      },
    ],
  },
  reports: [],
} as const;

const validContext = {
  moduleId: "test-module",
  curriculumId: "test-curriculum",
  gradeLevelId: "grade-10",
  unitId: "unit-1",
  outcomeCode: "TEST.10.1",
} as const;

function createService(): PedagogicalDecisionService {
  const modules = new ModuleLoader();
  modules.register(moduleDefinition);
  modules.enable(moduleDefinition.id);
  return new PedagogicalDecisionService(
    new CurriculumService(modules),
    modules,
  );
}

describe("Pedagojik Karar Servisi", () => {
  it("doğrulanmış müfredat bağlamı ve modül kurallarıyla bekleyen karar üretir", () => {
    const decision = createService().prepare({
      id: "request-1",
      intent: "lesson-plan",
      context: validContext,
    });

    expect(decision.status).toBe("awaiting-teacher-approval");
    expect(decision.context.outcome.code).toBe("TEST.10.1");
    expect(decision.rules.map((rule) => rule.id)).toEqual(["test-rule"]);
    expect(decision.rationale).toHaveLength(3);
    expect(decision.trace.map((entry) => entry.step)).toEqual([
      "curriculum-resolved",
      "module-rules-applied",
      "teacher-approval-pending",
    ]);
  });

  it("müfredat çözümleme hatasında karar ve üretim zincirini durdurur", () => {
    const service = createService();

    expect(() =>
      service.prepare({
        id: "request-invalid",
        intent: "lesson-plan",
        context: { ...validContext, unitId: "missing-unit" },
      }),
    ).toThrowError(
      expect.objectContaining<Partial<PedagogicalDecisionError>>({
        code: "CURRICULUM_RESOLUTION_FAILED",
        curriculumErrorCode: "UNIT_NOT_FOUND",
      }),
    );
  });

  it("öğretmen onayı olmadan kararı üretime hazır saymaz", () => {
    const decision = createService().prepare({
      id: "request-2",
      intent: "assessment",
      context: validContext,
    });

    expect(decision).not.toHaveProperty("approval");
    expect(decision.status).not.toBe("ready-for-generation");
  });

  it("yalnızca aynı karara ait öğretmen onayıyla üretim kapısını açar", () => {
    const service = createService();
    const decision = service.prepare({
      id: "request-3",
      intent: "assessment",
      context: validContext,
    });

    expect(() =>
      service.approve(decision, {
        decisionId: "decision:other",
        status: "approved",
        teacherId: "teacher-1",
        decidedAt: "2026-07-31T08:00:00+03:00",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<PedagogicalDecisionError>>({
        code: "APPROVAL_DECISION_MISMATCH",
      }),
    );

    const approved = service.approve(decision, {
      decisionId: decision.id,
      status: "approved",
      teacherId: "teacher-1",
      decidedAt: "2026-07-31T08:00:00+03:00",
    });

    expect(approved.status).toBe("ready-for-generation");
    expect(approved.approval.teacherId).toBe("teacher-1");
    expect(approved.trace.at(-1)?.step).toBe("teacher-approved");
  });

  it("reddedilen kararı üretime geçirmez", () => {
    const service = createService();
    const decision = service.prepare({
      id: "request-4",
      intent: "lesson-plan",
      context: validContext,
    });

    expect(() =>
      service.approve(decision, {
        decisionId: decision.id,
        status: "rejected",
        teacherId: "teacher-1",
        decidedAt: "2026-07-31T08:00:00+03:00",
      }),
    ).toThrowError(
      expect.objectContaining<Partial<PedagogicalDecisionError>>({
        code: "TEACHER_APPROVAL_REJECTED",
      }),
    );
  });
});
