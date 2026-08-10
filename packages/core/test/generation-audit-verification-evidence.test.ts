import { describe, expect, it } from "vitest";

import {
  GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT,
  GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES,
  GENERATION_AUDIT_VERIFICATION_EVIDENCE_SCHEMA_VERSION,
  createGenerationAuditVerificationEvidence,
  validateGenerationAuditVerificationEvidenceIntegrity,
  type GenerationAuditPackageValidationResult,
} from "../src/index.js";

const verifiedAt = "2026-08-10T09:00:00.000Z";

const sourcePackage = {
  schemaVersion: "1.2.0",
  exportedAt: "2026-08-10T08:00:00.000Z",
  academicYear: "2026-2027",
  containsStudentPersonalData: false,
  eventCount: 1,
  events: [{ eventId: "synthetic-event-1", documentType: "daily-plan" }],
  packageIntegrity: {
    algorithm: "SHA-256",
    digest: "0".repeat(64),
  },
};

const validation = (
  status: GenerationAuditPackageValidationResult["status"],
): GenerationAuditPackageValidationResult => ({
  status,
  schemaVersion: status === "warning" ? "1.1.0" : "1.2.0",
  eventCount: 1,
  computedDigest: null,
  errors: status === "rejected" ? ["Denetim paketi SHA-256 bütünlük özeti uyuşmuyor."] : [],
  warnings: status === "warning"
    ? ["Eski 1.1.0 paketi bütünlük özeti taşımıyor; içerik değişmezliği doğrulanamadı."]
    : [],
});

const personalDataKeyPattern =
  /^(student|students|studentid|studentname|studentnumber|schoolnumber|ogrenci|ogrenciler|ogrenciadi|ogrencino|tckimlikno|nationalid|identitynumber|email|phone|telephone|address)$/u;

const normalizedKey = (key: string): string =>
  key.normalize("NFD").replace(/[\u0300-\u036f]/gu, "").replace(/[^a-z0-9]/giu, "").toLocaleLowerCase("en-US");

const collectForbiddenKeys = (value: unknown): string[] => {
  const matches: string[] = [];
  const visit = (candidate: unknown): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!candidate || typeof candidate !== "object") return;
    for (const [key, item] of Object.entries(candidate)) {
      if (personalDataKeyPattern.test(normalizedKey(key))) matches.push(key);
      visit(item);
    }
  };
  visit(value);
  return matches;
};

describe("Pilot 2.5 makine-okunur doğrulama kanıtı", () => {
  it.each(["valid", "warning", "rejected"] as const)(
    "%s sonucunu bütünlük korumalı kanıta dönüştürür",
    (status) => {
      const evidence = createGenerationAuditVerificationEvidence({
        sourcePackage,
        validation: validation(status),
        verifiedAt,
      });

      expect(evidence.schemaVersion).toBe(GENERATION_AUDIT_VERIFICATION_EVIDENCE_SCHEMA_VERSION);
      expect(evidence.result.status).toBe(status);
      expect(evidence.sourcePackage.computedDigest).toMatch(/^[0-9a-f]{64}$/u);
      expect(evidence.evidenceIntegrity.digest).toMatch(/^[0-9a-f]{64}$/u);
      expect(validateGenerationAuditVerificationEvidenceIntegrity(evidence)).toBe(true);
    },
  );

  it("sabit zaman ve aynı sonuç için deterministik kanıt üretir", () => {
    const first = createGenerationAuditVerificationEvidence({
      sourcePackage,
      validation: validation("valid"),
      verifiedAt,
    });
    const reorderedSource = {
      events: sourcePackage.events,
      eventCount: sourcePackage.eventCount,
      containsStudentPersonalData: sourcePackage.containsStudentPersonalData,
      academicYear: sourcePackage.academicYear,
      exportedAt: sourcePackage.exportedAt,
      schemaVersion: sourcePackage.schemaVersion,
      packageIntegrity: sourcePackage.packageIntegrity,
    };
    const second = createGenerationAuditVerificationEvidence({
      sourcePackage: reorderedSource,
      validation: validation("valid"),
      verifiedAt,
    });

    expect(second.sourcePackage.computedDigest).toBe(first.sourcePackage.computedDigest);
    expect(second.evidenceIntegrity.digest).toBe(first.evidenceIntegrity.digest);
  });

  it("kaynak olaylarını kopyalamaz, kişisel veri anahtarı taşımaz ve politika sınırlarını kaydeder", () => {
    const evidence = createGenerationAuditVerificationEvidence({
      sourcePackage,
      validation: validation("valid"),
      verifiedAt,
    });

    expect(evidence).not.toHaveProperty("events");
    expect(evidence.sourcePackage).not.toHaveProperty("events");
    expect(JSON.stringify(evidence)).not.toContain("synthetic-event-1");
    expect(collectForbiddenKeys(evidence)).toEqual([]);
    expect(evidence.containsStudentPersonalData).toBe(false);
    expect(evidence.policy.maxEventCount).toBe(GENERATION_AUDIT_PACKAGE_MAX_EVENT_COUNT);
    expect(evidence.policy.maxFileSizeBytes).toBe(GENERATION_AUDIT_PACKAGE_MAX_FILE_SIZE_BYTES);
  });

  it("hata ve uyarıları kararlı kodlarla taşır", () => {
    const rejected = createGenerationAuditVerificationEvidence({
      sourcePackage,
      validation: validation("rejected"),
      verifiedAt,
    });
    const warning = createGenerationAuditVerificationEvidence({
      sourcePackage,
      validation: validation("warning"),
      verifiedAt,
    });

    expect(rejected.result.errors[0]).toMatchObject({
      code: expect.stringMatching(/^AUDIT_ERROR_[0-9A-F]{12}$/u),
      message: "Denetim paketi SHA-256 bütünlük özeti uyuşmuyor.",
    });
    expect(warning.result.warnings[0]).toMatchObject({
      code: expect.stringMatching(/^AUDIT_WARNING_[0-9A-F]{12}$/u),
      message: "Eski 1.1.0 paketi bütünlük özeti taşımıyor; içerik değişmezliği doğrulanamadı.",
    });
  });

  it("kanıt değiştirildiğinde bütünlük doğrulamasını reddeder", () => {
    const evidence = createGenerationAuditVerificationEvidence({
      sourcePackage,
      validation: validation("valid"),
      verifiedAt,
    });
    const tampered = {
      ...evidence,
      result: { ...evidence.result, eventCount: evidence.result.eventCount + 1 },
    };

    expect(validateGenerationAuditVerificationEvidenceIntegrity(tampered)).toBe(false);
  });
});
