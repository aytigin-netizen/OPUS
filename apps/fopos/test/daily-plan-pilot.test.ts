import { DocumentGenerationError } from "@opus/core";
import { describe, expect, it, vi } from "vitest";

import { createFoposDailyPlanPilot } from "../src/index.js";

const integrity = {
  algorithm: "SHA-256",
  digest: "07ae38b93d8054d84aac37039c71ad114a8685a3857084d568f260ce69f0737f",
  source: "final-artifact-bytes",
} as const;

const validRequest = {
  id: "fopos-daily-plan-pilot-1",
  unitId: "f10-u1",
  outcomeCode: "FEL.10.1.1",
} as const;

const draft = {
  title: "Felsefenin Doğası Günlük Planı",
  durationMinutes: 80,
  teacherNotes: ["İddia ve gerekçe ilişkisini görünür kıl."],
} as const;

describe("Entegrasyon Pilotu 1.1 — FOPOS günlük planı", () => {
  it("müfredat seçimini çözer ve öğretmen onayı bekleyen karar üretir", () => {
    const decision = createFoposDailyPlanPilot().prepare(validRequest);

    expect(decision.status).toBe("awaiting-teacher-approval");
    expect(decision.intent).toBe("daily-plan");
    expect(decision.context.reference).toMatchObject({
      moduleId: "fopos",
      curriculumId: "philosophy-tr-2024",
      gradeLevelId: "grade-10",
      unitId: "f10-u1",
      outcomeCode: "FEL.10.1.1",
    });
  });

  it("geçersiz ünite ve öğrenme çıktısında pilot akışı durdurur", () => {
    expect(() =>
      createFoposDailyPlanPilot().prepare({
        ...validRequest,
        unitId: "f10-u2",
      }),
    ).toThrow(/müfredat bağlamı çözümlenemedi/);
  });

  it("öğretmen onayı olmadan günlük plan üreticisini çağırmaz", () => {
    const pilot = createFoposDailyPlanPilot();
    const pending = pilot.prepare(validRequest);
    const generator = { generate: vi.fn() };

    expect(() =>
      pilot.generate(
        pending as never,
        draft,
        generator,
      ),
    ).toThrowError(
      expect.objectContaining<Partial<DocumentGenerationError>>({
        code: "DECISION_NOT_APPROVED",
      }),
    );
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("onay sonrası günlük planı üretir ve müfredat-onay kaydını korur", () => {
    const pilot = createFoposDailyPlanPilot();
    const pending = pilot.prepare(validRequest);
    const approved = pilot.approve(pending, {
      decisionId: pending.id,
      status: "approved",
      teacherId: "teacher-1",
      artifactIntegrity: integrity,
      decidedAt: "2026-07-31T15:30:00+03:00",
      note: "Günlük plan üretilebilir.",
    });
    const generated = pilot.generate(approved, draft, {
      generate: ({ payload, decision }) => ({
        title: payload.title,
        durationMinutes: payload.durationMinutes,
        outcomeCode: decision.context.outcome.code,
        rules: decision.rules.map((rule) => rule.id),
        artifactIntegrity: integrity,
      }),
    });

    expect(generated.artifact).toEqual({
      title: "Felsefenin Doğası Günlük Planı",
      durationMinutes: 80,
      outcomeCode: "FEL.10.1.1",
      artifactIntegrity: integrity,
      rules: [
        "curriculum-first",
        "preserve-philosophical-plurality",
        "require-reasoning",
      ],
    });
    expect(generated.provenance).toMatchObject({
      decisionId: approved.id,
      documentType: "daily-plan",
      teacherId: "teacher-1",
      curriculum: {
        moduleId: "fopos",
        gradeLevelId: "grade-10",
        unitId: "f10-u1",
        outcomeCode: "FEL.10.1.1",
      },
    });
  });
});
