import {
  CurriculumService,
  ModuleLoader,
  PedagogicalDecisionService,
  type ApprovedPedagogicalDecision,
  type PendingPedagogicalDecision,
  type TeacherApproval,
} from "@opus/core";

import { psyoposModule } from "./index.js";

export interface PsyoposPedagogicalRequest {
  readonly id: string;
  readonly intent: string;
  readonly unitId: string;
  readonly outcomeCode: string;
}

export interface PsyoposPedagogicalAdapter {
  prepare(request: PsyoposPedagogicalRequest): PendingPedagogicalDecision;
  approve(
    decision: PendingPedagogicalDecision,
    approval: TeacherApproval,
  ): ApprovedPedagogicalDecision;
}

export function createPsyoposPedagogicalAdapter(): PsyoposPedagogicalAdapter {
  const modules = new ModuleLoader();
  modules.register(psyoposModule);
  modules.enable(psyoposModule.id);
  const decisions = new PedagogicalDecisionService(
    new CurriculumService(modules),
    modules,
  );

  return Object.freeze({
    prepare: (request: PsyoposPedagogicalRequest) =>
      decisions.prepare({
        id: request.id,
        intent: request.intent,
        context: {
          moduleId: "psyopos",
          curriculumId: "psychology-tr-2026",
          gradeLevelId: "secondary-education",
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
