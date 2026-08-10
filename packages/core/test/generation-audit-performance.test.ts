import { memoryUsage } from "node:process";
import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";

import {
  calculateGenerationAuditPackageDigest,
  validateGenerationAuditPackage,
} from "../src/index.js";

const LOAD_PROFILES = Object.freeze([100, 1_000, 5_000, 10_000]);
const CI_VALIDATION_BUDGET_MS = 30_000;

const eventFor = (index: number) => ({
  eventId: `pilot-2-4-event-${index.toString().padStart(5, "0")}`,
  requestId: `OPUS-OUT-pilot-2-4:${index}`,
  decisionId: `decision:OPUS-PR-pilot-2-4:r${index + 1}`,
  recordId: `OPUS-PR-pilot-2-4-${index}`,
  revision: 1,
  documentType: "daily-plan",
  contractVersion: "1.2.0",
  approvedAt: "2026-08-10T00:00:00.000Z",
  generatedAt: "2026-08-10T00:01:00.000Z",
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
});

const unsignedPackage = (eventCount: number) => ({
  schemaVersion: "1.2.0" as const,
  exportedAt: "2026-08-10T00:02:00.000Z",
  academicYear: "2026-2027",
  exportScope: "academic-year" as const,
  queryScope: { type: "academic-year" as const, academicYear: "2026-2027" },
  containsStudentPersonalData: false as const,
  eventCount,
  events: Array.from({ length: eventCount }, (_, index) => eventFor(index)),
});

const signedPackage = (eventCount: number) => {
  const payload = unsignedPackage(eventCount);
  return {
    ...payload,
    packageIntegrity: {
      algorithm: "SHA-256" as const,
      digest: calculateGenerationAuditPackageDigest(payload),
    },
  };
};

describe("Pilot 2.4 denetim paketi performans ve dayanıklılık ölçümü", () => {
  it("deterministik 100-10.000 olay profillerini güvenli bütçe içinde doğrular", async () => {
    const measurements: Array<Record<string, number | string>> = [];

    for (const eventCount of LOAD_PROFILES) {
      const heapBefore = memoryUsage().heapUsed;
      const startedAt = performance.now();
      const payload = signedPackage(eventCount);
      const result = await validateGenerationAuditPackage(payload);
      const elapsedMs = performance.now() - startedAt;
      const heapDeltaBytes = Math.max(0, memoryUsage().heapUsed - heapBefore);
      const packageBytes = Buffer.byteLength(JSON.stringify(payload), "utf8");

      expect(result.status).toBe("valid");
      expect(result.eventCount).toBe(eventCount);
      expect(result.computedDigest).toBe(payload.packageIntegrity.digest);
      expect(elapsedMs).toBeLessThan(CI_VALIDATION_BUDGET_MS);

      measurements.push({
        eventCount,
        packageBytes,
        elapsedMs: Number(elapsedMs.toFixed(2)),
        heapDeltaBytes,
      });
    }

    console.info("PILOT_2_4_OPUS_MEASUREMENTS", JSON.stringify(measurements));
  }, 60_000);

  it("10.000 olaylık değiştirilmiş paketi reddeder", async () => {
    const payload = signedPackage(10_000);
    const result = await validateGenerationAuditPackage({
      ...payload,
      exportedAt: "2026-08-10T00:02:01.000Z",
    });
    expect(result.status).toBe("rejected");
    expect(result.errors).toContain("Denetim paketi SHA-256 bütünlük özeti uyuşmuyor.");
  }, 60_000);

  it("10.000 olaylık pakette iç içe kişisel veri anahtarını reddeder", async () => {
    const payload = unsignedPackage(10_000);
    payload.events[0] = {
      ...payload.events[0]!,
      metadata: { studentName: "PILOT_2_4_SENTINEL" },
    };
    const protectedPayload = {
      ...payload,
      packageIntegrity: {
        algorithm: "SHA-256" as const,
        digest: calculateGenerationAuditPackageDigest(payload),
      },
    };
    const result = await validateGenerationAuditPackage(protectedPayload);
    expect(result.status).toBe("rejected");
    expect(result.errors).toContain(
      "Öğrenci kişisel verisi anahtarları bulundu: events[0].metadata.studentName",
    );
  }, 60_000);
});
