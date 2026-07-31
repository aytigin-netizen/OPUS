import type {
  ApprovedPedagogicalDecision,
  ResolvedPedagogicalContext,
} from "./pedagogical-decision-service.js";

export interface DocumentGenerationRequest<TPayload> {
  readonly id: string;
  readonly decisionId: string;
  readonly documentType: string;
  readonly payload: TPayload;
}

export interface DocumentGenerationContext<TPayload> {
  readonly requestId: string;
  readonly documentType: string;
  readonly payload: TPayload;
  readonly decision: ApprovedPedagogicalDecision;
}

export interface DocumentGenerator<TPayload, TArtifact> {
  generate(context: DocumentGenerationContext<TPayload>): TArtifact;
}

export interface GenerationProvenance {
  readonly decisionId: string;
  readonly requestId: string;
  readonly documentType: string;
  readonly teacherId: string;
  readonly approvedAt: string;
  readonly curriculum: ResolvedPedagogicalContext["reference"];
}

export interface GeneratedDocument<TArtifact> {
  readonly status: "generated";
  readonly artifact: TArtifact;
  readonly provenance: GenerationProvenance;
}

export type DocumentGenerationErrorCode =
  | "DECISION_NOT_APPROVED"
  | "GENERATION_DECISION_MISMATCH"
  | "INVALID_GENERATION_REQUEST";

export class DocumentGenerationError extends Error {
  readonly code: DocumentGenerationErrorCode;

  constructor(code: DocumentGenerationErrorCode, message: string) {
    super(message);
    this.name = "DocumentGenerationError";
    this.code = code;
  }
}

const requireText = (value: string, field: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new DocumentGenerationError(
      "INVALID_GENERATION_REQUEST",
      `${field} boş olamaz.`,
    );
  }
  return normalized;
};

export class DocumentGenerationService {
  generate<TPayload, TArtifact>(
    decision: ApprovedPedagogicalDecision,
    request: DocumentGenerationRequest<TPayload>,
    generator: DocumentGenerator<TPayload, TArtifact>,
  ): GeneratedDocument<TArtifact> {
    if (decision.status !== "ready-for-generation") {
      throw new DocumentGenerationError(
        "DECISION_NOT_APPROVED",
        "Belge üretimi için öğretmen tarafından onaylanmış pedagojik karar gerekir.",
      );
    }

    if (request.decisionId !== decision.id) {
      throw new DocumentGenerationError(
        "GENERATION_DECISION_MISMATCH",
        `Belge üretim isteği farklı bir karara ait: ${request.decisionId}`,
      );
    }

    const requestId = requireText(request.id, "Belge üretim isteği kimliği");
    const documentType = requireText(request.documentType, "Belge türü");
    const context = Object.freeze({
      requestId,
      documentType,
      payload: request.payload,
      decision,
    });
    const artifact = generator.generate(context);

    return Object.freeze({
      status: "generated" as const,
      artifact,
      provenance: Object.freeze({
        decisionId: decision.id,
        requestId,
        documentType,
        teacherId: decision.approval.teacherId,
        approvedAt: decision.approval.decidedAt,
        curriculum: decision.context.reference,
      }),
    });
  }
}
