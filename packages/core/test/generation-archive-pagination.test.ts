import { describe, expect, it } from "vitest";

import {
  GENERATION_ARCHIVE_CURSOR_VERSION,
  GENERATION_ARCHIVE_PAGE_SIZES,
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

  it("search-results scope için queryScope ve bağlı scoped imleci doğrular", () => {
    const scopedCursor = {
      version: "1.1.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
      queryScope: {
        type: "search-results" as const,
        academicYear: "2026-2027",
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

  it("full academic year scope yalnızca type ve academicYear kabul eder", () => {
    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "academic-year" as const,
          academicYear: "2026-2027",
          documentType: "daily-plan" as const,
        },
      }),
    ).toThrow("QueryScope geçersiz");
  });

  it("search-results scope içinde academicYear ve curriculumSource kabul eder", () => {
    const validated = validateGenerationArchiveQuery({
      pageSize: 20,
      queryScope: {
        type: "search-results" as const,
        academicYear: "2026-2027",
        curriculumSource: "TR MEB",
      },
    });

    expect(validated).toEqual({
      pageSize: 20,
      queryScope: {
        type: "search-results",
        academicYear: "2026-2027",
        curriculumSource: "TR MEB",
      },
    });
  });

  it("search-results scope için academicYear zorunludur", () => {
    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "search-results" as const,
          documentType: "daily-plan" as const,
        },
      }),
    ).toThrow("QueryScope geçersiz");
  });

  it("kısa kimlik önekleri açıkça hata atar", () => {
    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "search-results" as const,
          academicYear: "2026-2027",
          eventId: "ab",
        },
      }),
    ).toThrow("Olay kimliği");
  });

  it("1.0.0 sorgu, 1.1.0 scoped imleci reddeder", () => {
    const scopedCursor = {
      version: "1.1.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
      queryScope: {
        type: "search-results" as const,
        academicYear: "2026-2027",
        documentType: "daily-plan" as const,
        eventId: "123",
      },
    };

    expect(() =>
      validateGenerationArchiveQuery({
        academicYear: "2026-2027",
        pageSize: 20,
        cursor: scopedCursor,
      }),
    ).toThrow("İmleç sorgu kapsamına bağlı olmalıdır");
  });

  it("1.1.0 scoped sorgu, 1.0.0 legacy imleci reddeder", () => {
    const legacyCursorLocal = {
      version: "1.0.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
    };

    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "search-results" as const,
          academicYear: "2026-2027",
        },
        cursor: legacyCursorLocal,
      }),
    ).toThrow("İmleç sorgu kapsamına bağlı olmalıdır");
  });

  it("public export GENERATION_ARCHIVE_PAGE_SIZES dışa aktarımını korur", () => {
    expect(GENERATION_ARCHIVE_PAGE_SIZES).toEqual([20, 50, 100]);
  });

  it("imleç sorgu kapsamı değiştiğinde reddeder", () => {
    const scopedCursor = {
      version: "1.1.0" as const,
      generatedAt: "2026-08-01T20:00:44.000Z",
      eventId: "123e4567-e89b-42d3-a456-426614174000",
      queryScope: {
        type: "search-results" as const,
        academicYear: "2026-2027",
        documentType: "daily-plan" as const,
        eventId: "123",
      },
    };
    expect(() =>
      validateGenerationArchiveQuery({
        pageSize: 20,
        queryScope: {
          type: "search-results" as const,
          academicYear: "2026-2027",
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
