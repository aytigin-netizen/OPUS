import { describe, expect, it } from "vitest";

import {
  calculateGenerationAuditPackageDigest,
  createGenerationAuditVerificationEvidence,
  createPortableAuditResult,
  validateGenerationAuditPackage,
  validatePortableAuditResult,
} from "../src/index.js";

const artifactDigest = "a".repeat(64);
const event = (eventId: string, digest = artifactDigest) => ({
  eventId,
  requestId: `request-${eventId}`,
  decisionId: `decision-${eventId}`,
  recordId: `record-${eventId}`,
  revision: 1,
  documentType: "daily-plan",
  contractVersion: "1.2.0",
  approvedAt: "2026-08-13T07:00:00.000Z",
  generatedAt: "2026-08-13T07:30:00.000Z",
  curriculum: {
    moduleId: "fopos",
    curriculumId: "philosophy",
    gradeLevelId: "10",
    unitId: "unit-1",
    outcomeCode: "FEL.10.1.1",
  },
  curriculumDatasetVersion: "2024.1",
  academicYear: "2026-2027",
  artifactIntegrity: { algorithm: "SHA-256", digest, source: "final-artifact-bytes" },
});

const packageWith = (events: readonly unknown[]) => {
  const unsigned = {
    schemaVersion: "1.2.0",
    exportedAt: "2026-08-13T08:00:00.000Z",
    academicYear: "2026-2027",
    exportScope: "academic-year",
    queryScope: { type: "academic-year", academicYear: "2026-2027" },
    containsStudentPersonalData: false,
    eventCount: events.length,
    events,
  };
  return {
    ...unsigned,
    packageIntegrity: { algorithm: "SHA-256", digest: calculateGenerationAuditPackageDigest(unsigned) },
  };
};

const evidenceFor = async (sourcePackage: unknown) =>
  createGenerationAuditVerificationEvidence({
    sourcePackage,
    validation: await validateGenerationAuditPackage(sourcePackage),
    verifiedAt: "2026-08-13T08:30:00.000Z",
  });

describe("Pilot 3.0 taşınabilir denetim sonucu", () => {
  it("tek başarılı eşleşmeden bütünlük korumalı sonuç üretir", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const result = await createPortableAuditResult({
      sourcePackage,
      evidence: await evidenceFor(sourcePackage),
      artifactDigest,
      createdAt: "2026-08-13T09:00:00.000Z",
    });

    expect(result.status).toBe("matched");
    expect(result.match.eventId).toBe("event-1");
    expect(result.sources.artifactDigest).toBe(artifactDigest);
    expect(result.containsStudentPersonalData).toBe(false);
    expect(validatePortableAuditResult(result)).toMatchObject({ status: "valid" });
    expect(JSON.stringify(result)).not.toMatch(/studentName|studentNumber|fileName|filePath/iu);
  });

  it("değiştirilmiş sonuç belgesini reddeder", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const result = await createPortableAuditResult({
      sourcePackage,
      evidence: await evidenceFor(sourcePackage),
      artifactDigest,
      createdAt: "2026-08-13T09:00:00.000Z",
    });
    const changed = { ...result, match: { ...result.match, outcomeCode: "FEL.10.9.9" } };
    expect(validatePortableAuditResult(changed).errors).toContain(
      "Taşınabilir denetim sonucu SHA-256 bütünlük özeti uyuşmuyor.",
    );
  });

  it("yanlış veya ilgisiz belge için sonuç üretmez", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    await expect(createPortableAuditResult({
      sourcePackage,
      evidence: await evidenceFor(sourcePackage),
      artifactDigest: "b".repeat(64),
      createdAt: "2026-08-13T09:00:00.000Z",
    })).rejects.toThrow("yalnızca tek ve başarılı belge eşleşmesinden");
  });

  it("belirsiz çoklu eşleşmeden sonuç üretmez", async () => {
    const sourcePackage = packageWith([event("event-1"), event("event-2")]);
    await expect(createPortableAuditResult({
      sourcePackage,
      evidence: await evidenceFor(sourcePackage),
      artifactDigest,
      createdAt: "2026-08-13T09:00:00.000Z",
    })).rejects.toThrow("yalnızca tek ve başarılı belge eşleşmesinden");
  });

  it("kişisel veri ve dosya adı anahtarlarını reddeder", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const result = await createPortableAuditResult({
      sourcePackage,
      evidence: await evidenceFor(sourcePackage),
      artifactDigest,
      createdAt: "2026-08-13T09:00:00.000Z",
    });
    expect(validatePortableAuditResult({ ...result, studentName: "Gizli" }).status).toBe("rejected");
    expect(validatePortableAuditResult({ ...result, fileName: "belge.docx" }).status).toBe("rejected");
  });
});
