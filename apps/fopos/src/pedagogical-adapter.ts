import {
  CurriculumService,
  ModuleLoader,
  PedagogicalDecisionService,
  type ApprovedPedagogicalDecision,
  type PendingPedagogicalDecision,
  type TeacherApproval,
} from "@opus/core";

import { foposModule } from "./index.js";

export interface FoposPedagogicalRequest {
  readonly id: string;
  readonly intent: string;
  readonly grade: 10 | 11;
  readonly unitId: string;
  readonly outcomeCode: string;
}

export interface FoposPedagogicalAdapter {
  prepare(request: FoposPedagogicalRequest): PendingPedagogicalDecision;
  approve(
    decision: PendingPedagogicalDecision,
    approval: TeacherApproval,
  ): ApprovedPedagogicalDecision;
}

export function createFoposPedagogicalAdapter(): FoposPedagogicalAdapter {
  const modules = new ModuleLoader();
  modules.register(foposModule);
  modules.enable(foposModule.id);
  const decisions = new PedagogicalDecisionService(
    new CurriculumService(modules),
    modules,
  );

  return Object.freeze({
    prepare: (request: FoposPedagogicalRequest) =>
      decisions.prepare({
        id: request.id,
        intent: request.intent,
        context: {
          moduleId: "fopos",
          curriculumId: "philosophy-tr-2024",
          gradeLevelId: `grade-${request.grade}`,
          unitId: request.unitId,
          outcomeCode: request.outcomeCode,
        },
      }),
    approve: (
      decision: PendingPedagogicalDecision,
      approval: TeacherApproval,
    ) => decisions.approve(decision, approval),
  });
}
