import {
  ARTIFACT_INTEGRITY_ALGORITHM,
  ARTIFACT_INTEGRITY_SOURCE,
  isArtifactIntegrity,
  type DocumentType,
} from "./document-generation-service.js";
import {
  matchGenerationAuditPackageToVerificationEvidence,
  type GenerationAuditPackageEvidenceMatchResult,
} from "./generation-audit-package-evidence-match.js";

export interface GenerationAuditArtifactMatch {
  readonly eventId: string;
  readonly documentType: DocumentType;
  readonly generatedAt: string;
  readonly outcomeCode: string;
  readonly digest: string;
}

export interface GenerationAuditPackageArtifactMatchResult {
  readonly status: "matched" | "ambiguous" | "rejected";
  readonly artifactDigest: string | null;
  readonly packageEvidenceMatch: GenerationAuditPackageEvidenceMatchResult;
  readonly matches: readonly GenerationAuditArtifactMatch[];
  readonly errors: readonly string[];
}

const digestPattern = /^[0-9a-f]{64}$/u;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export async function matchGenerationArtifactToAuditPackage(input: {
  readonly sourcePackage: unknown;
  readonly evidence: unknown;
  readonly artifactDigest: unknown;
}): Promise<GenerationAuditPackageArtifactMatchResult> {
  const errors: string[] = [];
  const packageEvidenceMatch =
    await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: input.sourcePackage,
      evidence: input.evidence,
    });

  const artifactDigest =
    typeof input.artifactDigest === "string" && digestPattern.test(input.artifactDigest)
      ? input.artifactDigest
      : null;

  if (packageEvidenceMatch.status !== "matched") {
    errors.push("Denetim paketi ile doğrulama kanıtı eşleşmiyor.");
  }
  if (artifactDigest === null) {
    errors.push("Belge özeti geçerli SHA-256 değeri olmalıdır.");
  }

  const matches: GenerationAuditArtifactMatch[] = [];
  if (errors.length === 0 && artifactDigest !== null && isRecord(input.sourcePackage)) {
    const events = input.sourcePackage.events;
    if (!Array.isArray(events)) {
      errors.push("Denetim paketi olay dizisi taşımıyor.");
    } else {
      for (const event of events) {
        if (!isRecord(event) || !isArtifactIntegrity(event.artifactIntegrity)) continue;
        if (event.artifactIntegrity.digest !== artifactDigest) continue;
        if (
          typeof event.eventId !== "string" ||
          typeof event.documentType !== "string" ||
          typeof event.generatedAt !== "string" ||
          !isRecord(event.curriculum) ||
          typeof event.curriculum.outcomeCode !== "string"
        ) continue;

        matches.push(Object.freeze({
          eventId: event.eventId,
          documentType: event.documentType as DocumentType,
          generatedAt: event.generatedAt,
          outcomeCode: event.curriculum.outcomeCode,
          digest: artifactDigest,
        }));
      }

      if (matches.length === 0) {
        errors.push("Seçilen belge denetim paketindeki hiçbir üretim olayıyla eşleşmiyor.");
      } else if (matches.length > 1) {
        errors.push("Belge özeti birden fazla üretim olayıyla eşleşti; olay kimliği belirsizdir.");
      }
    }
  }

  return Object.freeze({
    status:
      errors.length === 0
        ? "matched" as const
        : matches.length > 1
          ? "ambiguous" as const
          : "rejected" as const,
    artifactDigest,
    packageEvidenceMatch,
    matches: Object.freeze(matches),
    errors: Object.freeze([...new Set(errors)]),
  });
}

export const GENERATION_AUDIT_ARTIFACT_MATCH_ALGORITHM =
  ARTIFACT_INTEGRITY_ALGORITHM;
export const GENERATION_AUDIT_ARTIFACT_MATCH_SOURCE =
  ARTIFACT_INTEGRITY_SOURCE;
