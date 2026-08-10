import { isArtifactIntegrity, isDocumentType } from "./document-generation-service.js";
import {
  isGenerationArchiveQueryScope,
  type GenerationArchiveQueryScope,
} from "./generation-archive-pagination.js";

export const GENERATION_AUDIT_PACKAGE_SCHEMA_VERSION = "1.2.0" as const;
export const GENERATION_AUDIT_PACKAGE_SCHEMA_VERSIONS = Object.freeze([
  "1.1.0",
  GENERATION_AUDIT_PACKAGE_SCHEMA_VERSION,
] as const);
export const GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM = "SHA-256" as const;
export const GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT = 10_000 as const;
export const GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

export function isGenerationAuditPackageFileSizeAllowed(fileSizeBytes: number): boolean {
  return Number.isInteger(fileSizeBytes)
    && fileSizeBytes >= 0
    && fileSizeBytes <= GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES;
}

export type GenerationAuditPackageSchemaVersion =
  (typeof GENERATION_AUDIT_PACKAGE_SCHEMA_VERSIONS)[number];
export type GenerationAuditPackageValidationStatus = "valid" | "warning" | "rejected";

export interface GenerationAuditPackageIntegrity {
  readonly algorithm: typeof GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM;
  readonly digest: string;
}

export interface GenerationAuditEvent {
  readonly eventId: string;
  readonly requestId: string;
  readonly decisionId: string;
  readonly recordId: string;
  readonly revision: number;
  readonly documentType: string;
  readonly contractVersion: string;
  readonly approvedAt: string;
  readonly generatedAt: string;
  readonly curriculum: {
    readonly moduleId: string;
    readonly curriculumId: string;
    readonly gradeLevelId: string;
    readonly unitId: string;
    readonly outcomeCode: string;
  };
  readonly curriculumDatasetVersion: string;
  readonly academicYear: string;
  readonly artifactIntegrity: unknown | null;
}

interface GenerationAuditPackageBase {
  readonly exportedAt: string;
  readonly academicYear: string;
  readonly exportScope: GenerationArchiveQueryScope["type"];
  readonly queryScope: GenerationArchiveQueryScope;
  readonly containsStudentPersonalData: false;
  readonly events: readonly GenerationAuditEvent[];
}

export interface LegacyGenerationAuditPackage extends GenerationAuditPackageBase {
  readonly schemaVersion: "1.1.0";
}

export interface IntegrityProtectedGenerationAuditPackage extends GenerationAuditPackageBase {
  readonly schemaVersion: typeof GENERATION_AUDIT_PACKAGE_SCHEMA_VERSION;
  readonly eventCount: number;
  readonly packageIntegrity: GenerationAuditPackageIntegrity;
}

export type GenerationAuditPackage =
  | LegacyGenerationAuditPackage
  | IntegrityProtectedGenerationAuditPackage;

export interface GenerationAuditPackageValidationResult {
  readonly status: GenerationAuditPackageValidationStatus;
  readonly schemaVersion: GenerationAuditPackageSchemaVersion | null;
  readonly eventCount: number;
  readonly computedDigest: string | null;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

type JsonValue = null | boolean | number | string | readonly JsonValue[] | { readonly [key: string]: JsonValue };

const digestPattern = /^[0-9a-f]{64}$/u;
const forbiddenPersonalDataKeys = new Set([
  "student",
  "students",
  "studentid",
  "studentname",
  "studentnumber",
  "schoolnumber",
  "ogrenci",
  "ogrenciler",
  "ogrenciadi",
  "ogrencino",
  "tckimlikno",
  "nationalid",
  "identitynumber",
  "email",
  "phone",
  "telephone",
  "address",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeKey = (key: string): string =>
  key.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]/giu, "").toLocaleLowerCase("en-US");

const isAcademicYear = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{4})$/u.exec(value.trim());
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
};

const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && !Number.isNaN(Date.parse(value));

const isNonEmptyText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const stableJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "boolean" || typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Denetim paketi sonlu olmayan sayı içeremez.");
    return value;
  }
  if (Array.isArray(value)) return value.map(stableJsonValue);
  if (!isRecord(value)) throw new TypeError("Denetim paketi yalnızca JSON değerleri içermelidir.");

  return Object.freeze(Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, stableJsonValue(value[key])]),
  ));
};

const canonicalize = (value: unknown): string => JSON.stringify(stableJsonValue(value));

const sha256Constants = Object.freeze([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotateRight = (value: number, amount: number): number =>
  (value >>> amount) | (value << (32 - amount));

const utf8Bytes = (value: string): number[] => {
  const bytes: number[] = [];
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (point <= 0x7f) bytes.push(point);
    else if (point <= 0x7ff) bytes.push(0xc0 | (point >>> 6), 0x80 | (point & 0x3f));
    else if (point <= 0xffff) bytes.push(0xe0 | (point >>> 12), 0x80 | ((point >>> 6) & 0x3f), 0x80 | (point & 0x3f));
    else bytes.push(0xf0 | (point >>> 18), 0x80 | ((point >>> 12) & 0x3f), 0x80 | ((point >>> 6) & 0x3f), 0x80 | (point & 0x3f));
  }
  return bytes;
};

const sha256Hex = (value: string): string => {
  const bytes = utf8Bytes(value);
  const bitLength = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const high = Math.floor(bitLength / 0x1_0000_0000);
  const low = bitLength >>> 0;
  for (const word of [high, low]) {
    bytes.push((word >>> 24) & 0xff, (word >>> 16) & 0xff, (word >>> 8) & 0xff, word & 0xff);
  }

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const words = new Array<number>(64).fill(0);
  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const position = offset + index * 4;
      words[index] = (
        ((bytes[position] ?? 0) << 24) |
        ((bytes[position + 1] ?? 0) << 16) |
        ((bytes[position + 2] ?? 0) << 8) |
        (bytes[position + 3] ?? 0)
      ) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const previous15 = words[index - 15] ?? 0;
      const previous2 = words[index - 2] ?? 0;
      const sigma0 = rotateRight(previous15, 7) ^ rotateRight(previous15, 18) ^ (previous15 >>> 3);
      const sigma1 = rotateRight(previous2, 17) ^ rotateRight(previous2, 19) ^ (previous2 >>> 10);
      words[index] = ((words[index - 16] ?? 0) + sigma0 + (words[index - 7] ?? 0) + sigma1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash as [number, number, number, number, number, number, number, number];
    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temporary1 = (h + sum1 + choice + (sha256Constants[index] ?? 0) + (words[index] ?? 0)) >>> 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temporary2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temporary1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temporary1 + temporary2) >>> 0;
    }
    for (let index = 0; index < hash.length; index += 1) {
      hash[index] = ((hash[index] ?? 0) + ([a, b, c, d, e, f, g, h][index] ?? 0)) >>> 0;
    }
  }
  return hash.map((word) => word.toString(16).padStart(8, "0")).join("");
};

export function calculateCanonicalJsonDigest(value: unknown): string {\n  return sha256Hex(canonicalize(value));\n}

const withoutPackageIntegrity = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) throw new TypeError("Denetim paketi nesne olmalıdır.");
  const { packageIntegrity: _ignored, ...payload } = value;
  return payload;
};

export function calculateGenerationAuditPackageDigest(value: unknown): string {
  return calculateCanonicalJsonDigest(withoutPackageIntegrity(value));
}

const safeDigestEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
};

const findForbiddenPersonalDataKeys = (value: unknown): string[] => {
  const matches = new Set<string>();
  const visit = (candidate: unknown, path: string): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!isRecord(candidate)) return;
    for (const [key, item] of Object.entries(candidate)) {
      const childPath = path ? `${path}.${key}` : key;
      if (childPath !== "containsStudentPersonalData" && forbiddenPersonalDataKeys.has(normalizeKey(key))) {
        matches.add(childPath);
      }
      visit(item, childPath);
    }
  };
  visit(value, "");
  return [...matches].sort();
};

const validateEvent = (
  value: unknown,
  index: number,
  academicYear: string,
  errors: string[],
): string | null => {
  const field = `events[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${field} nesne olmalıdır.`);
    return null;
  }
  for (const key of ["eventId", "requestId", "decisionId", "recordId", "contractVersion", "curriculumDatasetVersion"] as const) {
    if (!isNonEmptyText(value[key])) errors.push(`${field}.${key} boş olmayan dize olmalıdır.`);
  }
  if (!Number.isInteger(value.revision) || Number(value.revision) < 1) {
    errors.push(`${field}.revision pozitif tam sayı olmalıdır.`);
  }
  if (typeof value.documentType !== "string" || !isDocumentType(value.documentType)) {
    errors.push(`${field}.documentType desteklenmiyor.`);
  }
  if (!isTimestamp(value.approvedAt)) errors.push(`${field}.approvedAt geçerli zaman damgası olmalıdır.`);
  if (!isTimestamp(value.generatedAt)) errors.push(`${field}.generatedAt geçerli zaman damgası olmalıdır.`);
  if (value.academicYear !== academicYear) errors.push(`${field}.academicYear paket öğretim yılıyla uyuşmuyor.`);

  if (!isRecord(value.curriculum)) {
    errors.push(`${field}.curriculum nesne olmalıdır.`);
  } else {
    for (const key of ["moduleId", "curriculumId", "gradeLevelId", "unitId", "outcomeCode"] as const) {
      if (!isNonEmptyText(value.curriculum[key])) errors.push(`${field}.curriculum.${key} boş olmayan dize olmalıdır.`);
    }
  }
  if (value.artifactIntegrity !== null && !isArtifactIntegrity(value.artifactIntegrity)) {
    errors.push(`${field}.artifactIntegrity geçersizdir.`);
  }
  return typeof value.eventId === "string" ? value.eventId : null;
};

export async function validateGenerationAuditPackage(
  value: unknown,
): Promise<GenerationAuditPackageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let schemaVersion: GenerationAuditPackageSchemaVersion | null = null;
  let eventCount = 0;
  let computedDigest: string | null = null;

  if (!isRecord(value)) {
    return Object.freeze({
      status: "rejected" as const,
      schemaVersion,
      eventCount,
      computedDigest,
      errors: Object.freeze(["Denetim paketi nesne olmalıdır."]),
      warnings: Object.freeze(warnings),
    });
  }

  if (value.schemaVersion === "1.1.0" || value.schemaVersion === GENERATION_AUDIT_PACKAGE_SCHEMA_VERSION) {
    schemaVersion = value.schemaVersion;
  } else {
    errors.push("Denetim paketi şema sürümü desteklenmiyor.");
  }

  if (!isTimestamp(value.exportedAt)) errors.push("exportedAt geçerli zaman damgası olmalıdır.");
  const academicYear = isAcademicYear(value.academicYear) ? value.academicYear.trim() : "";
  if (!academicYear) errors.push("academicYear geçersizdir.");
  if (value.containsStudentPersonalData !== false) {
    errors.push("containsStudentPersonalData değeri false olmalıdır.");
  }

  if (!isGenerationArchiveQueryScope(value.queryScope)) {
    errors.push("queryScope OPUS arşiv sözleşmesine uymuyor.");
  } else {
    if (value.exportScope !== value.queryScope.type) errors.push("exportScope ile queryScope.type uyuşmuyor.");
    if (academicYear && value.queryScope.academicYear !== academicYear) {
      errors.push("queryScope.academicYear paket öğretim yılıyla uyuşmuyor.");
    }
  }

  if (!Array.isArray(value.events)) {
    errors.push("events dizi olmalıdır.");
  } else {
    eventCount = value.events.length;
    if (eventCount > GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT) {
      errors.push(
        `Denetim paketi en fazla ${GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT.toLocaleString("tr-TR")} olay içerebilir.`,
      );
    } else {
      const eventIds = new Set<string>();
      value.events.forEach((event, index) => {
        const eventId = validateEvent(event, index, academicYear, errors);
        if (eventId && eventIds.has(eventId)) errors.push(`Yinelenen olay kimliği: ${eventId}`);
        if (eventId) eventIds.add(eventId);
      });
    }
  }

  const personalDataKeys = findForbiddenPersonalDataKeys(value);
  if (personalDataKeys.length > 0) {
    errors.push(`Öğrenci kişisel verisi anahtarları bulundu: ${personalDataKeys.join(", ")}`);
  }

  if (schemaVersion === GENERATION_AUDIT_PACKAGE_SCHEMA_VERSION) {
    if (!Number.isInteger(value.eventCount) || value.eventCount !== eventCount) {
      errors.push("eventCount olay dizisinin uzunluğuyla uyuşmuyor.");
    }
    const packageIntegrity = value.packageIntegrity;
    if (
      !isRecord(packageIntegrity) ||
      packageIntegrity.algorithm !== GENERATION_AUDIT_PACKAGE_INTEGRITY_ALGORITHM ||
      typeof packageIntegrity.digest !== "string" ||
      !digestPattern.test(packageIntegrity.digest)
    ) {
      errors.push("packageIntegrity geçerli SHA-256 özeti taşımalıdır.");
    } else {
      try {
        computedDigest = calculateGenerationAuditPackageDigest(value);
        if (!safeDigestEqual(computedDigest, packageIntegrity.digest)) {
          errors.push("Denetim paketi SHA-256 bütünlük özeti uyuşmuyor.");
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "SHA-256 özeti hesaplanamadı.");
      }
    }
  } else if (schemaVersion === "1.1.0") {
    warnings.push("Eski 1.1.0 paketi bütünlük özeti taşımıyor; içerik değişmezliği doğrulanamadı.");
  }

  return Object.freeze({
    status: errors.length > 0 ? "rejected" as const : warnings.length > 0 ? "warning" as const : "valid" as const,
    schemaVersion,
    eventCount,
    computedDigest,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
