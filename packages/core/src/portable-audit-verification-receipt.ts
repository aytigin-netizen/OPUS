import {
  GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
  calculateCanonicalJsonDigest,
} from "./generation-audit-package.js";
import {
  PORTABLE_AUDIT_RESULT_POLICY_VERSION,
  PORTABLE_AUDIT_RESULT_SCHEMA_VERSION,
  validatePortableAuditResult,
} from "./portable-audit-result.js";

export const PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION = "1.0.0" as const;
export const PORTABLE_AUDIT_VERIFICATION_RECEIPT_POLICY_VERSION = "1.0.0" as const;

export interface PortableAuditVerificationReceipt {
  readonly schemaVersion: typeof PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION;
  readonly verifiedAt: string;
  readonly status: "valid";
  readonly result: {
    readonly digest: string;
    readonly schemaVersion: typeof PORTABLE_AUDIT_RESULT_SCHEMA_VERSION;
    readonly policyVersion: typeof PORTABLE_AUDIT_RESULT_POLICY_VERSION;
    readonly eventId: string;
    readonly documentType: string;
    readonly outcomeCode: string;
  };
  readonly policy: {
    readonly version: typeof PORTABLE_AUDIT_VERIFICATION_RECEIPT_POLICY_VERSION;
    readonly requiresValidPortableResult: true;
  };
  readonly containsStudentPersonalData: false;
  readonly receiptIntegrity: {
    readonly algorithm: typeof GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM;
    readonly digest: string;
  };
}

export interface PortableAuditVerificationReceiptValidation {
  readonly status: "valid" | "rejected";
  readonly schemaVersion: typeof PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION | null;
  readonly computedDigest: string | null;
  readonly errors: readonly string[];
}

type ReceiptWithoutIntegrity = Omit<PortableAuditVerificationReceipt, "receiptIntegrity">;

const digestPattern = /^[0-9a-f]{64}$/u;
const forbiddenPersonalDataKeys = new Set([
  "student", "students", "studentid", "studentname", "studentnumber", "schoolnumber",
  "ogrenci", "ogrenciler", "ogrenciadi", "ogrencino", "tckimlikno", "nationalid",
  "identitynumber", "email", "phone", "telephone", "address", "filename", "filepath",
]);
const allowedKeys = {
  root: new Set(["schemaVersion", "verifiedAt", "status", "result", "policy", "containsStudentPersonalData", "receiptIntegrity"]),
  result: new Set(["digest", "schemaVersion", "policyVersion", "eventId", "documentType", "outcomeCode"]),
  policy: new Set(["version", "requiresValidPortableResult"]),
  receiptIntegrity: new Set(["algorithm", "digest"]),
};

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

const findUnexpectedKeys = (value: Record<string, unknown>): string[] => {
  const unexpected = Object.keys(value).filter((key) => !allowedKeys.root.has(key));
  for (const section of ["result", "policy", "receiptIntegrity"] as const) {
    const candidate = value[section];
    if (!isRecord(candidate)) continue;
    for (const key of Object.keys(candidate)) {
      if (!allowedKeys[section].has(key)) unexpected.push(`${section}.${key}`);
    }
  }
  return unexpected.sort();
};

const withoutIntegrity = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError("Bağımsız doğrulama makbuzu nesne olmalıdır.");
  const { receiptIntegrity: _ignored, ...payload } = value;
  return payload;
};

export function calculatePortableAuditVerificationReceiptDigest(value: unknown): string {
  return calculateCanonicalJsonDigest(withoutIntegrity(value));
}

export function createPortableAuditVerificationReceipt(input: {
  readonly sourceResult: unknown;
  readonly verifiedAt: string;
}): PortableAuditVerificationReceipt {
  if (!isTimestamp(input.verifiedAt)) {
    throw new TypeError("verifiedAt geçerli zaman damgası olmalıdır.");
  }
  const validation = validatePortableAuditResult(input.sourceResult);
  if (validation.status !== "valid" || validation.computedDigest === null) {
    throw new TypeError("Makbuz yalnızca geçerli taşınabilir denetim sonucundan üretilebilir.");
  }
  if (!isRecord(input.sourceResult) || !isRecord(input.sourceResult.match) || !isRecord(input.sourceResult.policy)) {
    throw new TypeError("Geçerli taşınabilir sonuç alanları eksiktir.");
  }

  const unsigned: ReceiptWithoutIntegrity = Object.freeze({
    schemaVersion: PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION,
    verifiedAt: input.verifiedAt,
    status: "valid" as const,
    result: Object.freeze({
      digest: validation.computedDigest,
      schemaVersion: PORTABLE_AUDIT_RESULT_SCHEMA_VERSION,
      policyVersion: PORTABLE_AUDIT_RESULT_POLICY_VERSION,
      eventId: input.sourceResult.match.eventId as string,
      documentType: input.sourceResult.match.documentType as string,
      outcomeCode: input.sourceResult.match.outcomeCode as string,
    }),
    policy: Object.freeze({
      version: PORTABLE_AUDIT_VERIFICATION_RECEIPT_POLICY_VERSION,
      requiresValidPortableResult: true as const,
    }),
    containsStudentPersonalData: false as const,
  });

  return Object.freeze({
    ...unsigned,
    receiptIntegrity: Object.freeze({
      algorithm: GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM,
      digest: calculatePortableAuditVerificationReceiptDigest(unsigned),
    }),
  });
}

export function validatePortableAuditVerificationReceipt(
  value: unknown,
): PortableAuditVerificationReceiptValidation {
  const errors: string[] = [];
  let schemaVersion: typeof PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION | null = null;
  let computedDigest: string | null = null;

  if (!isRecord(value)) {
    return Object.freeze({
      status: "rejected" as const,
      schemaVersion,
      computedDigest,
      errors: Object.freeze(["Bağımsız doğrulama makbuzu nesne olmalıdır."]),
    });
  }

  if (value.schemaVersion === PORTABLE_AUDIT_VERIFICATION_RECEIPT_SCHEMA_VERSION) {
    schemaVersion = value.schemaVersion;
  } else errors.push("Doğrulama makbuzu şema sürümü desteklenmiyor.");
  if (!isTimestamp(value.verifiedAt)) errors.push("verifiedAt geçerli zaman damgası olmalıdır.");
  if (value.status !== "valid") errors.push("status yalnızca valid olabilir.");
  if (value.containsStudentPersonalData !== false) {
    errors.push("containsStudentPersonalData değeri false olmalıdır.");
  }

  if (!isRecord(value.result)) errors.push("result nesne olmalıdır.");
  else {
    if (typeof value.result.digest !== "string" || !digestPattern.test(value.result.digest)) errors.push("result.digest geçerli SHA-256 özeti olmalıdır.");
    if (value.result.schemaVersion !== PORTABLE_AUDIT_RESULT_SCHEMA_VERSION) errors.push("Doğrulanan sonuç şema sürümü desteklenmiyor.");
    if (value.result.policyVersion !== PORTABLE_AUDIT_RESULT_POLICY_VERSION) errors.push("Doğrulanan sonuç politika sürümü desteklenmiyor.");
    for (const key of ["eventId", "documentType", "outcomeCode"] as const) {
      if (typeof value.result[key] !== "string" || value.result[key].length === 0) errors.push(`result.${key} gereklidir.`);
    }
  }

  if (
    !isRecord(value.policy) ||
    value.policy.version !== PORTABLE_AUDIT_VERIFICATION_RECEIPT_POLICY_VERSION ||
    value.policy.requiresValidPortableResult !== true
  ) errors.push("Doğrulama makbuzu politikası geçersizdir.");

  const forbiddenKeys = findForbiddenKeys(value);
  if (forbiddenKeys.length > 0) {
    errors.push(`Kişisel veri veya dosya adı anahtarları bulundu: ${forbiddenKeys.join(", ")}`);
  }
  const unexpectedKeys = findUnexpectedKeys(value);
  if (unexpectedKeys.length > 0) {
    errors.push(`Makbuzda izin verilmeyen alanlar bulundu: ${unexpectedKeys.join(", ")}`);
  }

  if (
    !isRecord(value.receiptIntegrity) ||
    value.receiptIntegrity.algorithm !== GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM ||
    typeof value.receiptIntegrity.digest !== "string" ||
    !digestPattern.test(value.receiptIntegrity.digest)
  ) errors.push("receiptIntegrity geçerli SHA-256 özeti taşımalıdır.");
  else {
    try {
      computedDigest = calculatePortableAuditVerificationReceiptDigest(value);
      if (computedDigest !== value.receiptIntegrity.digest) {
        errors.push("Doğrulama makbuzu SHA-256 bütünlük özeti uyuşmuyor.");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Doğrulama makbuzu özeti hesaplanamadı.");
    }
  }

  return Object.freeze({
    status: errors.length === 0 ? "valid" as const : "rejected" as const,
    schemaVersion,
    computedDigest,
    errors: Object.freeze([...new Set(errors)]),
  });
}
