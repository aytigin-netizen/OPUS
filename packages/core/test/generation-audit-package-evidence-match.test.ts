import { describe, expect, it } from "vitest";

import {
  calculateGenerationAuditPackageDigest,
  calculateGenerationAuditVerificationEvidenceDigest,
  createGenerationAuditVerificationEvidence,
  matchGenerationAuditPackageToVerificationEvidence,
  validateGenerationAuditPackage,
} from "../src/index.js";

const sourcePackage = {
  schemaVersion: "1.2.0",
  exportedAt: "2026-08-12T06:00:00.000Z",
  academicYear: "2026-2027",
  exportScope: "academic-year",
  queryScope: {
    type: "academic-year",
    academicYear: "2026-2027",
  },
  containsStudentPersonalData: false,
  eventCount: 1,
  events: [{
    eventId: "event-1",
    requestId: "request-1",
    decisionId: "decision-1",
    recordId: "record-1",
    revision: 1,
    documentType: "daily-plan",
    contractVersion: "1.0.0",
    approvedAt: "2026-08-12T05:00:00.000Z",
    generatedAt: "2026-08-12T05:30:00.000Z",
    curriculum: {
      moduleId: "fopos",
      curriculumId: "philosophy",
      gradeLevelId: "10",
      unitId: "unit-1",
      outcomeCode: "FEL.10.1.1",
    },
    curriculumDatasetVersion: "2024.1",
    academicYear: "2026-2027",
    artifactIntegrity: null,
  }],
  packageIntegrity: {
    algorithm: "SHA-256",
    digest: "",
  },
};

const integrityProtectedPackage = () => {
  const unsigned = {
    ...sourcePackage,
    packageIntegrity: {
      algorithm: "SHA-256",
      digest: "0".repeat(64),
    },
  };
  return {
    ...unsigned,
    packageIntegrity: {
      algorithm: "SHA-256",
      digest: calculateGenerationAuditPackageDigest(unsigned),
    },
  };
};

const evidenceFor = async (source: unknown) => {
  const validation = await validateGenerationAuditPackage(source);
  return createGenerationAuditVerificationEvidence({
    sourcePackage: source,
    validation,
    verifiedAt: "2026-08-12T06:30:00.000Z",
  });
};

describe("Pilot 2.7 kanıt-kaynak paket eşleştirmesi", () => {
  it("özgün denetim paketini doğrulama kanıtıyla eşleştirir", async () => {
    const source = integrityProtectedPackage();
    const evidence = await evidenceFor(source);

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: source,
      evidence,
    });

    expect(result.status).toBe("matched");
    expect(result.errors).toEqual([]);
    expect(result.computedPackageDigest).toBe(evidence.sourcePackage.computedDigest);
    expect(result.packageValidation.status).toBe("valid");
    expect(result.evidenceValidation.status).toBe("valid");
  });

  it("değiştirilmiş paketi reddeder", async () => {
    const source = integrityProtectedPackage();
    const evidence = await evidenceFor(source);
    const tampered = {
      ...source,
      academicYear: "2027-2028",
    };

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: tampered,
      evidence,
    });

    expect(result.status).toBe("rejected");
    expect(result.errors).toContain(
      "Denetim paketi SHA-256 özeti doğrulama kanıtındaki kaynak paket özetiyle uyuşmuyor.",
    );
  });

  it("başka pakete ait ilgisiz kanıtı reddeder", async () => {
    const source = integrityProtectedPackage();
    const unrelatedSource = {
      ...source,
      exportedAt: "2026-08-12T07:00:00.000Z",
    };
    const evidence = await evidenceFor(unrelatedSource);

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: source,
      evidence,
    });

    expect(result.status).toBe("rejected");
    expect(result.errors).toContain(
      "Denetim paketi SHA-256 özeti doğrulama kanıtındaki kaynak paket özetiyle uyuşmuyor.",
    );
  });

  it("yeniden imzalanmış olay sayısı eşleşmezliğini reddeder", async () => {
    const source = integrityProtectedPackage();
    const evidence = await evidenceFor(source);
    const forgedUnsigned = {
      ...evidence,
      result: {
        ...evidence.result,
        eventCount: 2,
      },
    };
    const { evidenceIntegrity: _ignored, ...payload } = forgedUnsigned;
    const forged = {
      ...payload,
      evidenceIntegrity: {
        algorithm: "SHA-256",
        digest: calculateGenerationAuditVerificationEvidenceDigest(payload),
      },
    };

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: source,
      evidence: forged,
    });

    expect(result.status).toBe("rejected");
  });

  it("kişisel veri anahtarı eklenmiş paketi, özeti yenilense bile reddeder", async () => {
    const source = integrityProtectedPackage();
    const evidence = await evidenceFor(source);
    const unsafeUnsigned = {
      ...source,
      studentName: "Örnek Öğrenci",
      packageIntegrity: {
        algorithm: "SHA-256",
        digest: "0".repeat(64),
      },
    };
    const unsafe = {
      ...unsafeUnsigned,
      packageIntegrity: {
        algorithm: "SHA-256",
        digest: calculateGenerationAuditPackageDigest(unsafeUnsigned),
      },
    };

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: unsafe,
      evidence,
    });

    expect(result.status).toBe("rejected");
    expect(result.errors).toContain("Denetim paketi geçerli değildir.");
    expect(result.packageValidation.errors.join(" ")).toContain("Öğrenci kişisel verisi");
  });

  it.each([null, "geçersiz", 42])("ilkel girdiyi güvenli biçimde reddeder: %p", async (source) => {
    const validSource = integrityProtectedPackage();
    const evidence = await evidenceFor(validSource);

    const result = await matchGenerationAuditPackageToVerificationEvidence({
      sourcePackage: source,
      evidence,
    });

    expect(result.status).toBe("rejected");
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
