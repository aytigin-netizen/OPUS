import type { CurriculumUnit, LearningOutcome } from "@opus/curriculum";

import {
  CurriculumService,
  CurriculumServiceError,
  type CurriculumServiceErrorCode,
  type OutcomeReference,
} from "./curriculum-service.js";
import type { AIRule } from "./module-contract.js";
import { ModuleLoader } from "./module-loader.js";

export interface PedagogicalRequest {
  readonly id: string;
  readonly intent: string;
  readonly context: OutcomeReference;
}

export interface DecisionTraceEntry {
  readonly step:
    | "curriculum-resolved"
    | "module-rules-applied"
    | "teacher-approval-pending"
    | "teacher-approved";
  readonly detail: string;
}

export interface ResolvedPedagogicalContext {
  readonly reference: OutcomeReference;
  readonly unit: CurriculumUnit;
  readonly outcome: LearningOutcome;
}

export interface PendingPedagogicalDecision {
  readonly id: string;
  readonly requestId: string;
  readonly intent: string;
  readonly status: "awaiting-teacher-approval";
  readonly context: ResolvedPedagogicalContext;
  readonly rules: readonly AIRule[];
  readonly rationale: readonly string[];
  readonly trace: readonly DecisionTraceEntry[];
}

export interface TeacherApproval {
  readonly decisionId: string;
  readonly status: "approved" | "rejected";
  readonly teacherId: string;
  readonly decidedAt: string;
  readonly note?: string;
}

export interface ApprovedPedagogicalDecision {
  readonly id: string;
  readonly requestId: string;
  readonly intent: string;
  readonly status: "ready-for-generation";
  readonly context: ResolvedPedagogicalContext;
  readonly rules: readonly AIRule[];
  readonly rationale: readonly string[];
  readonly trace: readonly DecisionTraceEntry[];
  readonly approval: TeacherApproval & { readonly status: "approved" };
}

export type PedagogicalDecisionErrorCode =
  | "CURRICULUM_RESOLUTION_FAILED"
  | "APPROVAL_DECISION_MISMATCH"
  | "TEACHER_APPROVAL_REJECTED";

export class PedagogicalDecisionError extends Error {
  readonly code: PedagogicalDecisionErrorCode;
  readonly curriculumErrorCode: CurriculumServiceErrorCode | undefined;

  constructor(
    code: PedagogicalDecisionErrorCode,
    message: string,
    options?: {
      readonly cause?: unknown;
      readonly curriculumErrorCode?: CurriculumServiceErrorCode;
    },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = "PedagogicalDecisionError";
    this.code = code;
    this.curriculumErrorCode = options?.curriculumErrorCode;
  }
}

const freezeList = <T>(items: readonly T[]): readonly T[] =>
  Object.freeze([...items]);

export class PedagogicalDecisionService {
  constructor(
    private readonly curriculum: CurriculumService,
    private readonly modules: ModuleLoader,
  ) {}

  prepare(request: PedagogicalRequest): PendingPedagogicalDecision {
    let unit: CurriculumUnit;
    let outcome: LearningOutcome;

    try {
      unit = this.curriculum.getUnit(request.context);
      outcome = this.curriculum.getOutcome(request.context);
    } catch (error) {
      if (error instanceof CurriculumServiceError) {
        throw new PedagogicalDecisionError(
          "CURRICULUM_RESOLUTION_FAILED",
          `Pedagojik istek için müfredat bağlamı çözümlenemedi: ${error.message}`,
          { cause: error, curriculumErrorCode: error.code },
        );
      }
      throw error;
    }

    const module = this.modules.get(request.context.moduleId);
    const rules = freezeList(module.ai_rules.rules);
    const rationale = freezeList([
      `${outcome.code} öğrenme çıktısı ${unit.id} ünitesi içinde doğrulandı.`,
      `${module.name} modülünün ${module.ai_rules.version} sürümlü kuralları bağlandı.`,
      "Pedagojik üretim, öğretmen onayı verilene kadar başlatılamaz.",
    ]);
    const trace = freezeList<DecisionTraceEntry>([
      {
        step: "curriculum-resolved",
        detail: `${request.context.curriculumId}/${request.context.gradeLevelId}/${unit.id}/${outcome.code}`,
      },
      {
        step: "module-rules-applied",
        detail: rules.map((rule) => rule.id).join(", "),
      },
      {
        step: "teacher-approval-pending",
        detail: "Nihai pedagojik karar öğretmen onayını bekliyor.",
      },
    ]);

    return Object.freeze({
      id: `decision:${request.id}`,
      requestId: request.id,
      intent: request.intent,
      status: "awaiting-teacher-approval",
      context: Object.freeze({
        reference: Object.freeze({ ...request.context }),
        unit,
        outcome,
      }),
      rules,
      rationale,
      trace,
    });
  }

  approve(
    decision: PendingPedagogicalDecision,
    approval: TeacherApproval,
  ): ApprovedPedagogicalDecision {
    if (approval.decisionId !== decision.id) {
      throw new PedagogicalDecisionError(
        "APPROVAL_DECISION_MISMATCH",
        `Öğretmen onayı farklı bir karara ait: ${approval.decisionId}`,
      );
    }

    if (approval.status === "rejected") {
      throw new PedagogicalDecisionError(
        "TEACHER_APPROVAL_REJECTED",
        `Öğretmen pedagojik kararı reddetti: ${decision.id}`,
      );
    }

    const approved = Object.freeze({ ...approval, status: "approved" as const });
    return Object.freeze({
      ...decision,
      status: "ready-for-generation",
      trace: freezeList<DecisionTraceEntry>([
        ...decision.trace,
        {
          step: "teacher-approved",
          detail: `${approval.teacherId} tarafından ${approval.decidedAt} tarihinde onaylandı.`,
        },
      ]),
      approval: approved,
    });
  }
}
