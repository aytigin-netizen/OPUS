import {
  GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
  GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT,
  GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES,
  calculateCanonicalJsonDigest,
  calculateGenerationAuditPackageDigest,
  type GenerationAuditPackageValidationResult,
} from "./generation-audit-package.js";

export const GENERATION_AUDIT_VERIFICATION_EVIDENCE_SCHEMA_VERSION = "1.0.0" as const;
export const GENERATION_AUDIT_VERIFICATION_POLICY_VERSION = "1.0.0" as const;

export interface GenerationAuditVerificationIssue {
  readonly code: string;
  readonly message: string;
}

export interface GenerationAuditVerificationEvidence {
  readonly schemaVersion: typeof GENERATION_AUDIT_VERIFICATION_EVIDENCE_SCHEMA_VERSION;
  readonly verifiedAt: string;
  readonly sourcePackage: {
    readonly schemaVersion: string | null;
    readonly digestAlgorithm: typeof GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM;
    readonly computedDigest: string;
  };
  readonly result: {
    readonly status: GenerationAuditPackageValidationResult["status"];
    readonly eventCount: number;
    readonly errors: readonly GenerationAuditVerificationIssue[];
    readonly warnings: readonly GenerationAuditVerificationIssue[];
  };
  readonly policy: {
    readonly version: typeof GENERATION_AUDIT_VERIFICATION_POLICY_VERSION;
    readonly maxEventCount: typeof GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT;
    readonly maxFileSizeBytes: number;
  };
  readonly containsStudentPersonalData: false;
  readonly evidenceIntegrity: {
    readonly algorithm: typeof GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM;
    readonly digest: string;
  };
}

type EvidenceWithoutIntegrity = Omit<GenerationAuditVerificationEvidence, "evidenceIntegrity">;

const digestPattern = /^[0-9a-f]{64}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isTimestamp = (value: string): boolean =>
  value.trim().length > 0 && !Number.isNaN(Date.parse(value));

const issueCode = (kind: "ERROR" | "WARNING", message: string): string =>
  `AUDIT_${kind}_${calculateCanonicalJsonDigest(message).slice(0, 12).toUpperCase()}`;

const toIssues = (
  kind: "ERROR" | "WARNING",
  messages: readonly string[],
): readonly GenerationAuditVerificationIssue[] =>
  Object.freeze(messages.map((message) => Object.freeze({
    code: issueCode(kind, message),
    message,
  })));

const withoutEvidenceIntegrity = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError("Doğrulama kanıtı nesne olmalıdır.");
  const { evidenceIntegrity: _ignored, ...payload } = value;
  return payload;
};

export function calculateGenerationAuditVerificationEvidenceDigest(value: unknown): string {
  return calculateCanonicalJsonDigest(withoutEvidenceIntegrity(value));
}

export function createGenerationAuditVerificationEvidence(input: {
  readonly sourcePackage: unknown;
  readonly validation: GenerationAuditPackageValidationResult;
  readonly verifiedAt: string;
}): GenerationAuditVerificationEvidence {
  if (!isRecord(input.sourcePackage)) {
    throw new TypeError("Kaynak denetim paketi nesne olmalıdır.");
  }
  if (!isTimestamp(input.verifiedAt)) {
    throw new TypeError("verifiedAt geçerli zaman damgası olmalıdır.");
  }

  const unsigned: EvidenceWithoutIntegrity = Object.freeze({
    schemaVersion: GENERATION_AUDIT_VERIFICATION_EVIDENCE_SCHEMA_VERSION,
    verifiedAt: input.verifiedAt,
    sourcePackage: Object.freeze({
      schemaVersion: input.validation.schemaVersion,
      digestAlgorithm: GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
      computedDigest: calculateGenerationAuditPackageDigest(input.sourcePackage),
    }),
    result: Object.freeze({
      status: input.validation.status,
      eventCount: input.validation.eventCount,
      errors: toIssues("ERROR", input.validation.errors),
      warnings: toIssues("WARNING", input.validation.warnings),
    }),
    policy: Object.freeze({
      version: GENERATION_AUDIT_VERIFICATION_POLICY_VERSION,
      maxEventCount: GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT,
      maxFileSizeBytes: GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES,
    }),
    containsStudentPersonalData: false,
  });

  return Object.freeze({
    ...unsigned,
    evidenceIntegrity: Object.freeze({
      algorithm: GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
      digest: calculateGenerationAuditVerificationEvidenceDigest(unsigned),
    }),
  });
}

export function validateGenerationAuditVerificationEvidenceIntegrity(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.evidenceIntegrity)) return false;
  const { algorithm, digest } = value.evidenceIntegrity;
  if (
    algorithm !== GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM ||
    typeof digest !== "string" ||
    !digestPattern.test(digest)
  ) return false;

  return calculateGenerationAuditVerificationEvidenceDigest(value) === digest;
}
