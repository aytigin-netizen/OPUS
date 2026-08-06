import { describe, expect, it } from "vitest";

import {
  GENERATION_ARCHIVE_CURSOR_VERSION,
  isGenerationArchiveCursor,
  validateGenerationArchiveQuery,
} from "../src/index.js";

const legacyCursor = {
  version: "1.0.0" as const,
  generatedAt: "2026-08-01T20:00:44.000Z",
  eventId: "123e4567-e89b-42d3-a456-426614174000",
} as const;

describe("Üretim arşivi sayfalama sözleşmesi", () => {
  it("öğretim yılı, belge türü, sayfa boyutu ve bileşik imleci doğrular", () => {
    expect(validateGenerationArchiveQuery({
      academicYear: "2026-2027",
      documentType: "daily-plan",
      pageSize: 50,
      cursor: legacyCursor,
    })).toEqual({
      academicYear: "2026-2027",
      documentType: "daily-plan",
      pageSize: 50,
      cursor: legacyCursor,
    });
    expect(isGenerationArchiveCursor(legacyCursor)).toBe(true);
  });

  it("search sonuçları için queryScope ve bağlı scoped imleci doğrular", () => {
    const scopedCursor = {
      version: "1.1.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
      queryScope: {
        type: "search-results" as const,
        documentType: "daily-plan" as const,
        curriculumSource: "T.C. Millî Eğitim Bakanlığı",
        eventId: "123",
        decisionId: "dec",
        requestId: "req",
        recordId: "rec",
      },
    };

    expect(validateGenerationArchiveQuery({
      pageSize: 20,
      queryScope: scopedCursor.queryScope,
      cursor: scopedCursor,
    })).toEqual({
      pageSize: 20,
      queryScope: scopedCursor.queryScope,
      cursor: scopedCursor,
    });
    expect(isGenerationArchiveCursor(scopedCursor)).toBe(true);
  });

  it("search-results scope içinde müfredat kaynağını tam eşleşme ile kabul eder", () => {
    const validated = validateGenerationArchiveQuery({
      pageSize: 20,
      queryScope: {
        type: "search-results" as const,
        curriculumSource: "TR MEB",
      },
    });

    expect(validated).toEqual({
      pageSize: 20,
      queryScope: {
        type: "search-results",
        curriculumSource: "TR MEB",
      },
    });
  });

  it("imleç sorgu kapsamı değiştiğinde reddeder", () => {
    const scopedCursor = {
      version: "1.1.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
      queryScope: {
        type: "search-results" as const,
        documentType: "daily-plan" as const,
        eventId: "123",
      },
    };
    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "search-results" as const,
          documentType: "daily-plan" as const,
          eventId: "999",
        },
        cursor: scopedCursor,
      }),
    ).toThrow("sorgu kapsamı değiştiğinde reddedildi");
  });

  it("kayıtsız belge türünü, sınırsız sayfa boyutunu ve bozuk öğretim yılını reddeder", () => {
    expect(() => validateGenerationArchiveQuery({
      academicYear: "2026-2028",
      pageSize: 50,
    })).toThrow("Öğretim yılı");
    expect(() => validateGenerationArchiveQuery({
      academicYear: "2026-2027",
      documentType: "student-report",
      pageSize: 50,
    })).toThrow("Belge türü");
    expect(() => validateGenerationArchiveQuery({
      academicYear: "2026-2027",
      pageSize: 500,
    })).toThrow("sayfa boyutu");
  });
});
