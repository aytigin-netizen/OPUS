import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  calculateGenerationAuditPackageDigest,
  validateGenerationAuditPackage,
} from "../src/index.js";

const baseEvent = {
  eventId: "123e4567-e89b-42d3-a456-426614174000",
  requestId: "OPUS-OUT-pilot:daily-plan",
  decisionId: "decision:OPUS-PR-pilot:r2",
  recordId: "OPUS-PR-pilot",
  revision: 2,
  documentType: "daily-plan",
  contractVersion: "1.2.0",
  approvedAt: "2026-08-08T20:00:00.000Z",
  generatedAt: "2026-08-08T20:01:00.000Z",
  curriculum: {
    moduleId: "fopos",
    curriculumId: "philosophy-tr-2024",
    gradeLevelId: "grade-10",
    unitId: "f10-u1",
    outcomeCode: "FEL.10.1.1",
  },
  curriculumDatasetVersion: "2024.1",
  academicYear: "2026-2027",
  artifactIntegrity: null,
} as const;

const unsignedPackage = () => ({
  schemaVersion: "1.2.0" as const,
  exportedAt: "2026-08-09T00:00:00.000Z",
  academicYear: "2026-2027",
  exportScope: "academic-year" as const,
  queryScope: {
    type: "academic-year" as const,
    academicYear: "2026-2027",
  },
  containsStudentPersonalData: false as const,
  eventCount: 1,
  events: [baseEvent],
});

const signedPackage = async () => {
  const payload = unsignedPackage();
  const digest = calculateGenerationAuditPackageDigest(payload);
  return {
    ...payload,
    packageIntegrity: { algorithm: "SHA-256" as const, digest },
  };
};

describe("Denetim paketi geri doğrulama sözleşmesi", () => {
  it("değişmemiş 1.2.0 paketini geçerli kabul eder", async () => {
    const result = await validateGenerationAuditPackage(await signedPackage());
    expect(result.status).toBe("valid");
    expect(result.errors).toEqual([]);
    expect(result.eventCount).toBe(1);
    expect(result.computedDigest).toMatch(/^[0-9a-f]{64}$/u);
  });

  it("alan sırasından bağımsız kanonik özet üretir", async () => {
    const payload = unsignedPackage();
    const reordered = {
      events: payload.events,
      eventCount: payload.eventCount,
      containsStudentPersonalData: payload.containsStudentPersonalData,
      queryScope: payload.queryScope,
      exportScope: payload.exportScope,
      academicYear: payload.academicYear,
      exportedAt: payload.exportedAt,
      schemaVersion: payload.schemaVersion,
    };
    expect(calculateGenerationAuditPackageDigest(reordered))
      .toBe(calculateGenerationAuditPackageDigest(payload));
  });

  it("paket içeriği değiştirildiğinde özeti reddeder", async () => {
    const payload = await signedPackage();
    const tampered = { ...payload, exportedAt: "2026-08-09T00:00:01.000Z" };
    const result = await validateGenerationAuditPackage(tampered);
    expect(result.status).toBe("rejected");
    expect(result.errors).toContain("Denetim paketi SHA-256 bütünlük özeti uyuşmuyor.");
  });

  it("kapsam ve öğretim yılı uyuşmazlığını reddeder", async () => {
    const payload = await signedPackage();
    const result = await validateGenerationAuditPackage({
      ...payload,
      exportScope: "search-results",
      academicYear: "2025-2026",
    });
    expect(result.status).toBe("rejected");
    expect(result.errors).toContain("exportScope ile queryScope.type uyuşmuyor.");
    expect(result.errors).toContain("queryScope.academicYear paket öğretim yılıyla uyuşmuyor.");
  });

  it("öğrenci kişisel verisi anahtarını derinlemesine reddeder", async () => {
    const payload = await signedPackage();
    const result = await validateGenerationAuditPackage({
      ...payload,
      events: [{ ...baseEvent, metadata: { studentName: "Örnek Öğrenci" } }],
    });
    expect(result.status).toBe("rejected");
    expect(result.errors.some((message) => message.includes("studentName"))).toBe(true);
  });

  it("eventCount uyuşmazlığını reddeder", async () => {
    const payload = await signedPackage();
    const result = await validateGenerationAuditPackage({ ...payload, eventCount: 2 });
    expect(result.status).toBe("rejected");
    expect(result.errors).toContain("eventCount olay dizisinin uzunluğuyla uyuşmuyor.");
  });

  it("eski 1.1.0 paketini özet eksikliği uyarısıyla açar", async () => {
    const { eventCount: _eventCount, ...payload } = unsignedPackage();
    const result = await validateGenerationAuditPackage({
      ...payload,
      schemaVersion: "1.1.0",
    });
    expect(result.status).toBe("warning");
    expect(result.warnings).toContain(
      "Eski 1.1.0 paketi bütünlük özeti taşımıyor; içerik değişmezliği doğrulanamadı.",
    );
  });

  it("geçersiz JSON yerine geçen ilkel değeri güvenle reddeder", async () => {
    const result = await validateGenerationAuditPackage("geçersiz");
    expect(result.status).toBe("rejected");
    expect(result.errors).toEqual(["Denetim paketi nesne olmalıdır."]);
  });
});


type AuditParityFixture = {
  readonly id: string;
  readonly payload: unknown;
  readonly expected: {
    readonly status: "valid" | "warning" | "rejected";
    readonly eventCount: number;
    readonly computedDigest: string | null;
    readonly errors: readonly string[];
    readonly warnings: readonly string[];
  };
};

const auditParityFixtures = JSON.parse(
  readFileSync(new URL("./fixtures/generation-audit-parity.json", import.meta.url), "utf8"),
) as {
  readonly fixtureSet: string;
  readonly containsRealStudentData: boolean;
  readonly cases: readonly AuditParityFixture[];
};

describe("Pilot 2.3 OPUS/FOPOS denetim sözleşmesi paritesi", () => {
  it("ortak fikstür kümesinin güvenlik ve kapsam beyanını doğrular", () => {
    expect(auditParityFixtures.fixtureSet).toBe("opus-fopos-audit-parity-2.3");
    expect(auditParityFixtures.containsRealStudentData).toBe(false);
    expect(auditParityFixtures.cases.map(({ id }) => id)).toEqual([
      "valid-1.2.0",
      "reordered-equivalent",
      "tampered-content",
      "legacy-1.1.0",
      "scope-and-academic-year-mismatch",
      "event-count-mismatch",
      "duplicate-event-id",
      "nested-student-personal-data",
    ]);
  });

  for (const fixture of auditParityFixtures.cases) {
    it(`${fixture.id} için ortak beklenen sonucu üretir`, async () => {
      const result = await validateGenerationAuditPackage(fixture.payload);
      expect(result.status).toBe(fixture.expected.status);
      expect(result.eventCount).toBe(fixture.expected.eventCount);
      expect(result.computedDigest).toBe(fixture.expected.computedDigest);
      expect(result.errors).toEqual(fixture.expected.errors);
      expect(result.warnings).toEqual(fixture.expected.warnings);
    });
  }

  it("alan sırası değişen eşdeğer pakette aynı SHA-256 özetini korur", () => {
    const [valid, reordered] = auditParityFixtures.cases;
    expect(valid?.expected.computedDigest).toMatch(/^[0-9a-f]{64}$/u);
    expect(reordered?.expected.computedDigest).toBe(valid?.expected.computedDigest);
  });
});
