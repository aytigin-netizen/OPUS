export const DOCUMENT_TYPES = Object.freeze(["daily-plan", "annual-plan", "exam", "department-meeting-minutes"] as const);

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const ARTIFACT_INTEGRITY_ALGORITHM = "SHA-256" as const;
export const ARTIFACT_INTEGRITY_SOURCE = "final-artifact-bytes" as const;

export interface ArtifactIntegrity {
  readonly algorithm: typeof ARTIFACT_INTEGRITY_ALGORITHM;
  readonly digest: string;
  readonly source: typeof ARTIFACT_INTEGRITY_SOURCE;
}

export function isArtifactIntegrity(value: unknown): value is ArtifactIntegrity {
  if (!value || typeof value !== "object") return false;
  const integrity = value as Partial<ArtifactIntegrity>;
  return integrity.algorithm === ARTIFACT_INTEGRITY_ALGORITHM &&
    integrity.source === ARTIFACT_INTEGRITY_SOURCE &&
    typeof integrity.digest === "string" &&
    /^[0-9a-f]{64}$/u.test(integrity.digest);
}

export function isDocumentType(value: string): value is DocumentType {
  return DOCUMENT_TYPES.includes(value as DocumentType);
}

import type {
  ApprovedPedagogicalDecision,
  ResolvedPedagogicalContext,
} from "./pedagogical-decision-service.js";

export interface DocumentGenerationRequest<TPayload> {
  readonly id: string;
  readonly eventId: string;
  readonly decisionId: string;
  readonly documentType: DocumentType;
  readonly payload: TPayload;
}

export interface DocumentGenerationContext<TPayload> {
  readonly requestId: string;
  readonly documentType: DocumentType;
  readonly payload: TPayload;
  readonly decision: ApprovedPedagogicalDecision;
}

export interface DocumentGenerator<TPayload, TArtifact extends { readonly artifactIntegrity: ArtifactIntegrity }> {
  generate(context: DocumentGenerationContext<TPayload>): TArtifact;
}

export interface GenerationProvenance {
  readonly eventId: string;
  readonly decisionId: string;
  readonly requestId: string;
  readonly documentType: DocumentType;
  readonly teacherId: string;
  readonly approvedAt: string;
  readonly curriculum: ResolvedPedagogicalContext["reference"];
  readonly artifactIntegrity: ArtifactIntegrity;
}

export interface GeneratedDocument<TArtifact> {
  readonly status: "generated";
  readonly artifact: TArtifact;
  readonly provenance: GenerationProvenance;
}

export type DocumentGenerationErrorCode =
  | "DECISION_NOT_APPROVED"
  | "GENERATION_DECISION_MISMATCH"
  | "INVALID_GENERATION_REQUEST"
  | "UNSUPPORTED_DOCUMENT_TYPE";

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
  generate<TPayload, TArtifact extends { readonly artifactIntegrity: ArtifactIntegrity }>(
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
    const eventId = requireText(request.eventId, "Üretim olayı kimliği");
    const documentTypeCandidate = requireText(request.documentType, "Belge türü");
    if (!isDocumentType(documentTypeCandidate)) {
      throw new DocumentGenerationError(
        "UNSUPPORTED_DOCUMENT_TYPE",
        `Desteklenmeyen belge türü: ${documentTypeCandidate}`,
      );
    }
    const documentType = documentTypeCandidate;
    const context = Object.freeze({
      requestId,
      documentType,
      payload: request.payload,
      decision,
    });
    const artifact = generator.generate(context);
    if (!isArtifactIntegrity(artifact.artifactIntegrity)) {
      throw new DocumentGenerationError(
        "INVALID_GENERATION_REQUEST",
        "Nihai belge üreticisi geçerli SHA-256 bütünlük özeti döndürmelidir.",
      );
    }

    return Object.freeze({
      status: "generated" as const,
      artifact,
      provenance: Object.freeze({
        eventId,
        decisionId: decision.id,
        requestId,
        documentType,
        teacherId: decision.approval.teacherId,
        approvedAt: decision.approval.decidedAt,
        curriculum: decision.context.reference,
        artifactIntegrity: artifact.artifactIntegrity,
      }),
    });
  }
}
