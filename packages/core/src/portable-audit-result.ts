import {
  GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
  calculateCanonicalJsonDigest,
} from "./generation-audit-package.js";
import {
  matchGenerationArtifactToAuditPackage,
  type GenerationAuditArtifactMatch,
} from "./generation-audit-package-artifact-match.js";

export const PORTABLE_AUDIT_RESULT_SCHEMA_VERSION = "1.0.0" as const;
export const PORTABLE_AUDIT_RESULT_POLICY_VERSION = "1.0.0" as const;

export interface PortableAuditResult {
  readonly schemaVersion: typeof PORTABLE_AUDIT_RESULT_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly status: "matched";
  readonly sources: {
    readonly packageDigest: string;
    readonly evidenceDigest: string;
    readonly artifactDigest: string;
  };
  readonly match: GenerationAuditArtifactMatch;
  readonly policy: {
    readonly version: typeof PORTABLE_AUDIT_RESULT_POLICY_VERSION;
    readonly requiresUniqueArtifactMatch: true;
  };
  readonly containsStudentPersonalData: false;
  readonly resultIntegrity: {
    readonly algorithm: typeof GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM;
    readonly digest: string;
  };
}

export interface PortableAuditResultValidation {
  readonly status: "valid" | "rejected";
  readonly schemaVersion: typeof PORTABLE_AUDIT_RESULT_SCHEMA_VERSION | null;
  readonly computedDigest: string | null;
  readonly errors: readonly string[];
}

type PortableAuditResultWithoutIntegrity = Omit<PortableAuditResult, "resultIntegrity">;

const digestPattern = /^[0-9a-f]{64}$/u;
const forbiddenPersonalDataKeys = new Set([
  "student", "students", "studentid", "studentname", "studentnumber", "schoolnumber",
  "ogrenci", "ogrenciler", "ogrenciadi", "ogrencino", "tckimlikno", "nationalid",
  "identitynumber", "email", "phone", "telephone", "address", "filename", "filepath",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

const normalizeKey = (key: string): string =>
  key.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]/giu, "")
    .toLocaleLowerCase("en-US");

const findForbiddenKeys = (value: unknown): string[] => {
  const matches = new Set<string>();
  const visit = (candidate: unknown, path: string): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!isRecord(candidate)) return;
    for (const [key, item] of Object.entries(candidate)) {
      const childPath = path ? `${path}.${key}` : key;
      if (
        childPath !== "containsStudentPersonalData" &&
        forbiddenPersonalDataKeys.has(normalizeKey(key))
      ) matches.add(childPath);
      visit(item, childPath);
    }
  };
  visit(value, "");
  return [...matches].sort();
};

const withoutIntegrity = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError("Taşınabilir denetim sonucu nesne olmalıdır.");
  const { resultIntegrity: _ignored, ...payload } = value;
  return payload;
};

export function calculatePortableAuditResultDigest(value: unknown): string {
  return calculateCanonicalJsonDigest(withoutIntegrity(value));
}

export async function createPortableAuditResult(input: {
  readonly sourcePackage: unknown;
  readonly evidence: unknown;
  readonly artifactDigest: unknown;
  readonly createdAt: string;
}): Promise<PortableAuditResult> {
  if (!isTimestamp(input.createdAt)) {
    throw new TypeError("createdAt geçerli zaman damgası olmalıdır.");
  }

  const artifactMatch = await matchGenerationArtifactToAuditPackage({
    sourcePackage: input.sourcePackage,
    evidence: input.evidence,
    artifactDigest: input.artifactDigest,
  });
  if (artifactMatch.status !== "matched" || artifactMatch.matches.length !== 1) {
    throw new TypeError("Taşınabilir sonuç yalnızca tek ve başarılı belge eşleşmesinden üretilebilir.");
  }

  const packageDigest = artifactMatch.packageEvidenceMatch.computedPackageDigest;
  const evidenceDigest = artifactMatch.packageEvidenceMatch.evidenceValidation.computedDigest;
  if (packageDigest === null || evidenceDigest === null || artifactMatch.artifactDigest === null) {
    throw new TypeError("Denetim kaynak özetleri eksiksiz olmalıdır.");
  }

  const unsigned: PortableAuditResultWithoutIntegrity = Object.freeze({
    schemaVersion: PORTABLE_AUDIT_RESULT_SCHEMA_VERSION,
    createdAt: input.createdAt,
    status: "matched" as const,
    sources: Object.freeze({
      packageDigest,
      evidenceDigest,
      artifactDigest: artifactMatch.artifactDigest,
    }),
    match: artifactMatch.matches[0]!,
    policy: Object.freeze({
      version: PORTABLE_AUDIT_RESULT_POLICY_VERSION,
      requiresUniqueArtifactMatch: true as const,
    }),
    containsStudentPersonalData: false as const,
  });

  return Object.freeze({
    ...unsigned,
    resultIntegrity: Object.freeze({
      algorithm: GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
      digest: calculatePortableAuditResultDigest(unsigned),
    }),
  });
}

export function validatePortableAuditResult(value: unknown): PortableAuditResultValidation {
  const errors: string[] = [];
  let schemaVersion: typeof PORTABLE_AUDIT_RESULT_SCHEMA_VERSION | null = null;
  let computedDigest: string | null = null;

  if (!isRecord(value)) {
    return Object.freeze({
      status: "rejected" as const,
      schemaVersion,
      computedDigest,
      errors: Object.freeze(["Taşınabilir denetim sonucu nesne olmalıdır."]),
    });
  }

  if (value.schemaVersion === PORTABLE_AUDIT_RESULT_SCHEMA_VERSION) {
    schemaVersion = value.schemaVersion;
  } else errors.push("Taşınabilir denetim sonucu şema sürümü desteklenmiyor.");

  if (!isTimestamp(value.createdAt)) errors.push("createdAt geçerli zaman damgası olmalıdır.");
  if (value.status !== "matched") errors.push("status yalnızca matched olabilir.");
  if (value.containsStudentPersonalData !== false) {
    errors.push("containsStudentPersonalData değeri false olmalıdır.");
  }

  if (!isRecord(value.sources)) errors.push("sources nesne olmalıdır.");
  else for (const key of ["packageDigest", "evidenceDigest", "artifactDigest"] as const) {
    if (typeof value.sources[key] !== "string" || !digestPattern.test(value.sources[key])) {
      errors.push(`sources.${key} geçerli SHA-256 özeti olmalıdır.`);
    }
  }

  if (!isRecord(value.match)) errors.push("match nesne olmalıdır.");
  else {
    if (typeof value.match.eventId !== "string" || value.match.eventId.length === 0) errors.push("match.eventId gereklidir.");
    if (typeof value.match.documentType !== "string" || value.match.documentType.length === 0) errors.push("match.documentType gereklidir.");
    if (!isTimestamp(value.match.generatedAt)) errors.push("match.generatedAt geçerli zaman damgası olmalıdır.");
    if (typeof value.match.outcomeCode !== "string" || value.match.outcomeCode.length === 0) errors.push("match.outcomeCode gereklidir.");
    if (typeof value.match.digest !== "string" || !digestPattern.test(value.match.digest)) errors.push("match.digest geçerli SHA-256 özeti olmalıdır.");
    if (isRecord(value.sources) && value.match.digest !== value.sources.artifactDigest) {
      errors.push("match.digest belge özetiyle uyuşmuyor.");
    }
  }

  if (
    !isRecord(value.policy) ||
    value.policy.version !== PORTABLE_AUDIT_RESULT_POLICY_VERSION ||
    value.policy.requiresUniqueArtifactMatch !== true
  ) errors.push("Denetim sonucu politikası geçersizdir.");

  const forbiddenKeys = findForbiddenKeys(value);
  if (forbiddenKeys.length > 0) {
    errors.push(`Kişisel veri veya dosya adı anahtarları bulundu: ${forbiddenKeys.join(", ")}`);
  }

  if (
    !isRecord(value.resultIntegrity) ||
    value.resultIntegrity.algorithm !== GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM ||
    typeof value.resultIntegrity.digest !== "string" ||
    !digestPattern.test(value.resultIntegrity.digest)
  ) errors.push("resultIntegrity geçerli SHA-256 özeti taşımalıdır.");
  else {
    try {
      computedDigest = calculatePortableAuditResultDigest(value);
      if (computedDigest !== value.resultIntegrity.digest) {
        errors.push("Taşınabilir denetim sonucu SHA-256 bütünlük özeti uyuşmuyor.");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Denetim sonucu özeti hesaplanamadı.");
    }
  }

  return Object.freeze({
    status: errors.length === 0 ? "valid" as const : "rejected" as const,
    schemaVersion,
    computedDigest,
    errors: Object.freeze([...new Set(errors)]),
  });
}
