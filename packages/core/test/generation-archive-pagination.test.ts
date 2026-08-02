import { describe, expect, it } from "vitest";

import {
  GENERATION_ARCHIVE_CURSOR_VERSION,
  isGenerationArchiveCursor,
  validateGenerationArchiveQuery,
} from "../src/index.js";

const cursor = {
  version: GENERATION_ARCHIVE_CURSOR_VERSION,
  generatedAt: "2026-08-01T20:00:44.000Z",
  eventId: "123e4567-e89b-42d3-a456-426614174000",
} as const;

describe("Üretim arşivi sayfalama sözleşmesi", () => {
  it("öğretim yılı, belge türü, sayfa boyutu ve bileşik imleci doğrular", () => {
    expect(validateGenerationArchiveQuery({
      academicYear: "2026-2027",
      documentType: "daily-plan",
      pageSize: 50,
      cursor,
    })).toEqual({
      academicYear: "2026-2027",
      documentType: "daily-plan",
      pageSize: 50,
      cursor,
    });
    expect(isGenerationArchiveCursor(cursor)).toBe(true);
  });

  it("kararsız veya eksik imleci reddeder", () => {
    expect(isGenerationArchiveCursor({ generatedAt: cursor.generatedAt })).toBe(false);
    expect(() => validateGenerationArchiveQuery({
      academicYear: "2026-2027",
      pageSize: 50,
      cursor: { ...cursor, eventId: "event:unstable" },
    })).toThrow("imleci geçersiz");
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
