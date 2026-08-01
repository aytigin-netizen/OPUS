import { describe, expect, it, vi } from "vitest";

import {
  CurriculumService,
  DocumentGenerationError,
  DocumentGenerationService,
  ModuleLoader,
  PedagogicalDecisionService,
  type ApprovedPedagogicalDecision,
} from "../src/index.js";

const moduleDefinition = {
  contractVersion: "1.0.0",
  id: "pilot-module",
  name: "Pilot Modülü",
  subjectIds: ["pilot-subject"],
  curriculum: [{
    schemaVersion: "1.0.0",
    id: "pilot-curriculum",
    subjectId: "pilot-subject",
    title: "Pilot Müfredatı",
    countryCode: "TR",
    languageTag: "tr-TR",
    version: "1.0.0",
    status: "active",
    effectiveFrom: "2026-09-01",
    effectiveTo: null,
    source: {
      authority: "Pilot Kurumu",
      title: "Pilot Programı",
      documentVersion: "1",
      publishedAt: "2026-01-01",
    },
    gradeLevels: [{ id: "grade-10", label: "10. sınıf", sequence: 10 }],
    units: [{
      id: "unit-1",
      sequence: 1,
      title: "Pilot ünitesi",
      gradeLevelIds: ["grade-10"],
      estimatedPeriods: 8,
      outcomeIds: ["outcome-1"],
    }],
    outcomes: [{
      id: "outcome-1",
      code: "PILOT.10.1",
      unitId: "unit-1",
      title: "Pilot çıktısı",
      description: "Pilot öğrenme çıktısı.",
      gradeLevelIds: ["grade-10"],
      kind: "integrated",
      evidenceHints: [],
    }],
  }],
  assessment: [
    {
      id: "pilot-assessment",
      name: "Pilot değerlendirmesi",
      supportedOutcomeKinds: ["integrated"],
    },
  ],
  documents: [],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "pilot-rule",
        description: "Pilot üretimde doğrulanmış müfredat bağlamını koru.",
        effect: "require",
      },
    ],
  },
  reports: [],
} as const;

function createDecision() {
  const modules = new ModuleLoader();
  modules.register(moduleDefinition);
  modules.enable(moduleDefinition.id);
  const decisions = new PedagogicalDecisionService(
    new CurriculumService(modules),
    modules,
  );
  const pending = decisions.prepare({
    id: "pilot-request",
    intent: "daily-plan",
    context: {
      moduleId: "pilot-module",
      curriculumId: "pilot-curriculum",
      gradeLevelId: "grade-10",
      unitId: "unit-1",
      outcomeCode: "PILOT.10.1",
    },
  });
  return { decisions, pending };
}

describe("Belge Üretim Servisi", () => {
  it("öğretmen onayı olmadan belge üreticisini çağırmaz", () => {
    const { pending } = createDecision();
    const generator = { generate: vi.fn() };

    expect(() =>
      new DocumentGenerationService().generate(
        pending as unknown as ApprovedPedagogicalDecision,
        {
          id: "generation-1",
          eventId: "event:generation-1",
          decisionId: pending.id,
          documentType: "daily-plan",
          payload: {},
        },
        generator,
      ),
    ).toThrowError(
      expect.objectContaining<Partial<DocumentGenerationError>>({
        code: "DECISION_NOT_APPROVED",
      }),
    );
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("farklı karara ait üretim isteğini reddeder", () => {
    const { decisions, pending } = createDecision();
    const approved = decisions.approve(pending, {
      decisionId: pending.id,
      status: "approved",
      teacherId: "teacher-1",
      decidedAt: "2026-07-31T15:00:00+03:00",
    });

    expect(() =>
      new DocumentGenerationService().generate(
        approved,
        {
          id: "generation-2",
          eventId: "event:generation-2",
          decisionId: "decision:other",
          documentType: "daily-plan",
          payload: {},
        },
        { generate: () => ({}) },
      ),
    ).toThrowError(
      expect.objectContaining<Partial<DocumentGenerationError>>({
        code: "GENERATION_DECISION_MISMATCH",
      }),
    );
  });

  it("onaylı kararı üreticiye taşır ve izlenebilirlik kaydı döndürür", () => {
    const { decisions, pending } = createDecision();
    const approved = decisions.approve(pending, {
      decisionId: pending.id,
      status: "approved",
      teacherId: "teacher-1",
      decidedAt: "2026-07-31T15:00:00+03:00",
    });
    const generated = new DocumentGenerationService().generate(
      approved,
      {
        id: "generation-3",
        eventId: "event:generation-3",
        decisionId: approved.id,
        documentType: "daily-plan",
        payload: { title: "Pilot plan" },
      },
      {
        generate: ({ payload, decision }) => ({
          title: payload.title,
          outcomeCode: decision.context.outcome.code,
        }),
      },
    );

    expect(generated).toMatchObject({
      status: "generated",
      artifact: { title: "Pilot plan", outcomeCode: "PILOT.10.1" },
      provenance: {
        decisionId: approved.id,
        teacherId: "teacher-1",
        documentType: "daily-plan",
      },
    });
  });

  it("yalnız kayıtlı belge türlerini kabul eder", () => {
    const { decisions, pending } = createDecision();
    const approved = decisions.approve(pending, {
      decisionId: pending.id,
      status: "approved",
      teacherId: "teacher-1",
      decidedAt: "2026-08-01T12:00:00+03:00",
    });
    expect(() =>
      new DocumentGenerationService().generate(
        approved,
        { id: "generation-invalid", eventId: "event:invalid", decisionId: approved.id, documentType: "student-report" as never, payload: {} },
        { generate: () => ({}) },
      ),
    ).toThrowError(expect.objectContaining<Partial<DocumentGenerationError>>({ code: "UNSUPPORTED_DOCUMENT_TYPE" }));
  });

  it("kayıtlı belge türlerini ayrı, değişmez üretim olayları olarak kaydeder", () => {
    const { decisions, pending } = createDecision();
    const approved = decisions.approve(pending, {
      decisionId: pending.id,
      status: "approved",
      teacherId: "teacher-1",
      decidedAt: "2026-08-01T12:00:00+03:00",
    });
    const service = new DocumentGenerationService();
    const daily = service.generate(
      approved,
      { id: "generation-daily", eventId: "event:daily", decisionId: approved.id, documentType: "daily-plan", payload: {} },
      { generate: () => ({ kind: "daily" }) },
    );
    const annual = service.generate(
      approved,
      { id: "generation-annual", eventId: "event:annual", decisionId: approved.id, documentType: "annual-plan", payload: {} },
      { generate: () => ({ kind: "annual" }) },
    );
    const exam = service.generate(
      approved,
      { id: "generation-exam", eventId: "event:exam", decisionId: approved.id, documentType: "exam", payload: {} },
      { generate: () => ({ kind: "exam-package" }) },
    );
    expect(daily.provenance.eventId).not.toBe(annual.provenance.eventId);
    const meeting = service.generate(
      approved,
      { id: "generation-meeting", eventId: "event:meeting", decisionId: approved.id, documentType: "department-meeting-minutes", payload: {} },
      { generate: () => ({ kind: "department-meeting-minutes" }) },
    );
    expect(annual.provenance.eventId).not.toBe(exam.provenance.eventId);
    expect(exam.provenance.eventId).not.toBe(meeting.provenance.eventId);
    expect(annual.provenance.documentType).toBe("annual-plan");
    expect(exam.provenance.documentType).toBe("exam");
    expect(meeting.provenance.documentType).toBe("department-meeting-minutes");
  });

});
