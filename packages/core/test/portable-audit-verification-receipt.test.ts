import { describe, expect, it } from "vitest";

import {
  calculatePortableAuditResultDigest,
  createPortableAuditVerificationReceipt,
  validatePortableAuditVerificationReceipt,
} from "../src/index.js";

const unsignedResult = {
  schemaVersion: "1.0.0",
  createdAt: "2026-08-14T08:00:00.000Z",
  status: "matched",
  sources: {
    packageDigest: "a".repeat(64),
    evidenceDigest: "b".repeat(64),
    artifactDigest: "c".repeat(64),
  },
  match: {
    eventId: "event-pilot-3-2",
    documentType: "daily-plan",
    generatedAt: "2026-08-14T07:30:00.000Z",
    outcomeCode: "FEL.10.1.1",
    digest: "c".repeat(64),
  },
  policy: { version: "1.0.0", requiresUniqueArtifactMatch: true },
  containsStudentPersonalData: false,
} as const;

const validResult = () => ({
  ...unsignedResult,
  resultIntegrity: {
    algorithm: "SHA-256",
    digest: calculatePortableAuditResultDigest(unsignedResult),
  },
});

describe("Pilot 3.2 bağımsız doğrulama makbuzu", () => {
  it("yalnız geçerli sonuçtan asgari ve bütünlük korumalı makbuz üretir", () => {
    const sourceResult = validResult();
    const receipt = createPortableAuditVerificationReceipt({
      sourceResult,
      verifiedAt: "2026-08-14T09:00:00.000Z",
    });

    expect(receipt.status).toBe("valid");
    expect(receipt.result.digest).toBe(sourceResult.resultIntegrity.digest);
    expect(receipt.result.eventId).toBe("event-pilot-3-2");
    expect(receipt.containsStudentPersonalData).toBe(false);
    expect(validatePortableAuditVerificationReceipt(receipt).status).toBe("valid");
    expect(JSON.stringify(receipt)).not.toMatch(/studentName|studentNumber|fileName|filePath|sources|match/iu);
  });

  it("reddedilmiş veya değiştirilmiş sonuçtan makbuz üretmez", () => {
    const sourceResult = validResult();
    const changed = { ...sourceResult, match: { ...sourceResult.match, outcomeCode: "FEL.10.9.9" } };
    expect(() => createPortableAuditVerificationReceipt({
      sourceResult: changed,
      verifiedAt: "2026-08-14T09:00:00.000Z",
    })).toThrow("yalnızca geçerli taşınabilir denetim sonucundan");
  });

  it("makbuzdaki tek karakterlik değişikliği bütünlük hatasıyla reddeder", () => {
    const receipt = createPortableAuditVerificationReceipt({
      sourceResult: validResult(),
      verifiedAt: "2026-08-14T09:00:00.000Z",
    });
    const changed = { ...receipt, result: { ...receipt.result, outcomeCode: "FEL.10.1.2" } };
    expect(validatePortableAuditVerificationReceipt(changed).errors).toContain(
      "Doğrulama makbuzu SHA-256 bütünlük özeti uyuşmuyor.",
    );
  });

  it("desteklenmeyen makbuz şema ve politika sürümlerini reddeder", () => {
    const receipt = createPortableAuditVerificationReceipt({
      sourceResult: validResult(),
      verifiedAt: "2026-08-14T09:00:00.000Z",
    });
    expect(validatePortableAuditVerificationReceipt({ ...receipt, schemaVersion: "2.0.0" }).status).toBe("rejected");
    expect(validatePortableAuditVerificationReceipt({
      ...receipt,
      policy: { ...receipt.policy, version: "2.0.0" },
    }).status).toBe("rejected");
  });

  it("kişisel veri, dosya adı ve kaynak JSON içeriği alanlarını reddeder", () => {
    const receipt = createPortableAuditVerificationReceipt({
      sourceResult: validResult(),
      verifiedAt: "2026-08-14T09:00:00.000Z",
    });
    expect(validatePortableAuditVerificationReceipt({ ...receipt, studentName: "Gizli" }).status).toBe("rejected");
    expect(validatePortableAuditVerificationReceipt({ ...receipt, filePath: "/private/result.json" }).status).toBe("rejected");
    expect(validatePortableAuditVerificationReceipt({ ...receipt, sourceResult: validResult() }).errors).toContain(
      "Makbuzda izin verilmeyen alanlar bulundu: sourceResult",
    );
  });
});
