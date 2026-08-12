import { describe, expect, it } from "vitest";

import {
  calculateGenerationAuditPackageDigest,
  createGenerationAuditVerificationEvidence,
  matchGenerationArtifactToAuditPackage,
  validateGenerationAuditPackage,
} from "../src/index.js";

const artifactDigest = "a".repeat(64);

const event = (eventId: string, digest: string | null = artifactDigest) => ({
  eventId,
  requestId: `request-${eventId}`,
  decisionId: `decision-${eventId}`,
  recordId: `record-${eventId}`,
  revision: 1,
  documentType: "daily-plan",
  contractVersion: "1.2.0",
  approvedAt: "2026-08-12T07:00:00.000Z",
  generatedAt: "2026-08-12T07:30:00.000Z",
  curriculum: {
    moduleId: "fopos",
    curriculumId: "philosophy",
    gradeLevelId: "10",
    unitId: "unit-1",
    outcomeCode: "FEL.10.1.1",
  },
  curriculumDatasetVersion: "2024.1",
  academicYear: "2026-2027",
  artifactIntegrity: digest === null ? null : {
    algorithm: "SHA-256",
    digest,
    source: "final-artifact-bytes",
  },
});

const packageWith = (events: readonly unknown[]) => {
  const unsigned = {
    schemaVersion: "1.2.0",
    exportedAt: "2026-08-12T08:00:00.000Z",
    academicYear: "2026-2027",
    exportScope: "academic-year",
    queryScope: { type: "academic-year", academicYear: "2026-2027" },
    containsStudentPersonalData: false,
    eventCount: events.length,
    events,
  };
  return {
    ...unsigned,
    packageIntegrity: {
      algorithm: "SHA-256",
      digest: calculateGenerationAuditPackageDigest(unsigned),
    },
  };
};

const evidenceFor = async (sourcePackage: unknown) => {
  const validation = await validateGenerationAuditPackage(sourcePackage);
  return createGenerationAuditVerificationEvidence({
    sourcePackage,
    validation,
    verifiedAt: "2026-08-12T08:30:00.000Z",
  });
};

describe("Pilot 2.8 denetim paketi-belge eşleştirmesi", () => {
  it("belge özetini tek üretim olayıyla eşleştirir", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const evidence = await evidenceFor(sourcePackage);

    const result = await matchGenerationArtifactToAuditPackage({
      sourcePackage,
      evidence,
      artifactDigest,
    });

    expect(result.status).toBe("matched");
    expect(result.errors).toEqual([]);
    expect(result.matches).toEqual([{
      eventId: "event-1",
      documentType: "daily-plan",
      generatedAt: "2026-08-12T07:30:00.000Z",
      outcomeCode: "FEL.10.1.1",
      digest: artifactDigest,
    }]);
  });

  it("değiştirilmiş veya ilgisiz belgeyi reddeder", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const evidence = await evidenceFor(sourcePackage);

    const result = await matchGenerationArtifactToAuditPackage({
      sourcePackage,
      evidence,
      artifactDigest: "b".repeat(64),
    });

    expect(result.status).toBe("rejected");
    expect(result.errors).toContain(
      "Seçilen belge denetim paketindeki hiçbir üretim olayıyla eşleşmiyor.",
    );
  });

  it("aynı özeti taşıyan birden fazla üretim olayını belirsiz olarak bildirir", async () => {
    const sourcePackage = packageWith([event("event-1"), event("event-2")]);
    const evidence = await evidenceFor(sourcePackage);

    const result = await matchGenerationArtifactToAuditPackage({
      sourcePackage,
      evidence,
      artifactDigest,
    });

    expect(result.status).toBe("ambiguous");
    expect(result.matches).toHaveLength(2);
    expect(result.errors).toContain(
      "Belge özeti birden fazla üretim olayıyla eşleşti; olay kimliği belirsizdir.",
    );
  });

  it("paket ve kanıt eşleşmeden belge eşleştirmesi yapmaz", async () => {
    const sourcePackage = packageWith([event("event-1")]);
    const unrelatedPackage = packageWith([event("event-2", "b".repeat(64))]);
    const evidence = await evidenceFor(unrelatedPackage);

    const result = await matchGenerationArtifactToAuditPackage({
      sourcePackage,
      evidence,
      artifactDigest,
    });

    expect(result.status).toBe("rejected");
    expect(result.matches).toEqual([]);
    expect(result.errors).toContain("Denetim paketi ile doğrulama kanıtı eşleşmiyor.");
  });

  it.each([null, "geçersiz", "A".repeat(64)])(
    "geçersiz belge özetini güvenli biçimde reddeder: %p",
    async (invalidDigest) => {
      const sourcePackage = packageWith([event("event-1")]);
      const evidence = await evidenceFor(sourcePackage);

      const result = await matchGenerationArtifactToAuditPackage({
        sourcePackage,
        evidence,
        artifactDigest: invalidDigest,
      });

      expect(result.status).toBe("rejected");
      expect(result.matches).toEqual([]);
      expect(result.errors).toContain("Belge özeti geçerli SHA-256 değeri olmalıdır.");
    },
  );

  it("bütünlük özeti olmayan eski üretim olayını eşleşmiş saymaz", async () => {
    const sourcePackage = packageWith([event("event-1", null)]);
    const evidence = await evidenceFor(sourcePackage);

    const result = await matchGenerationArtifactToAuditPackage({
      sourcePackage,
      evidence,
      artifactDigest,
    });

    expect(result.status).toBe("rejected");
    expect(result.matches).toEqual([]);
  });
});
