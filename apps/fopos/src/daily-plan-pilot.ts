import {
  DocumentGenerationService,
  type ApprovedPedagogicalDecision,
  type ArtifactIntegrity,
  type DocumentGenerator,
  type GeneratedDocument,
  type PendingPedagogicalDecision,
  type TeacherApproval,
} from "@opus/core";

import { createFoposPedagogicalAdapter } from "./pedagogical-adapter.js";

export interface FoposDailyPlanDraft {
  readonly title: string;
  readonly durationMinutes: 80;
  readonly teacherNotes: readonly string[];
}

export interface FoposDailyPlanPilotRequest {
  readonly id: string;
  readonly unitId: string;
  readonly outcomeCode: string;
}

export interface FoposDailyPlanPilot {
  prepare(request: FoposDailyPlanPilotRequest): PendingPedagogicalDecision;
  approve(
    decision: PendingPedagogicalDecision,
    approval: TeacherApproval,
  ): ApprovedPedagogicalDecision;
  generate<TArtifact extends { readonly artifactIntegrity: ArtifactIntegrity }>(
    decision: ApprovedPedagogicalDecision,
    draft: FoposDailyPlanDraft,
    generator: DocumentGenerator<FoposDailyPlanDraft, TArtifact>,
  ): GeneratedDocument<TArtifact>;
}

export function createFoposDailyPlanPilot(): FoposDailyPlanPilot {
  const pedagogy = createFoposPedagogicalAdapter();
  const documents = new DocumentGenerationService();

  return Object.freeze({
    prepare: (request: FoposDailyPlanPilotRequest) =>
      pedagogy.prepare({
        id: request.id,
        intent: "daily-plan",
        grade: 10,
        unitId: request.unitId,
        outcomeCode: request.outcomeCode,
      }),
    approve: (
      decision: PendingPedagogicalDecision,
      approval: TeacherApproval,
    ) => pedagogy.approve(decision, approval),
    generate: <TArtifact extends { readonly artifactIntegrity: ArtifactIntegrity }>(
      decision: ApprovedPedagogicalDecision,
      draft: FoposDailyPlanDraft,
      generator: DocumentGenerator<FoposDailyPlanDraft, TArtifact>,
    ) =>
      documents.generate(
        decision,
        {
          id: `${decision.requestId}:daily-plan`,
          eventId: `event:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          decisionId: decision.id,
          documentType: "daily-plan",
          payload: draft,
        },
        generator,
      ),
  });
}
