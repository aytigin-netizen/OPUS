import {
  isDocumentType,
  type DocumentType,
} from "./document-generation-service.js";

export const GENERATION_ARCHIVE_CURSOR_VERSION = "1.0.0" as const;
export const GENERATION_ARCHIVE_PAGE_SIZES = Object.freeze([20, 50, 100] as const);

export type GenerationArchivePageSize = (typeof GENERATION_ARCHIVE_PAGE_SIZES)[number];

export interface GenerationArchiveCursor {
  readonly version: typeof GENERATION_ARCHIVE_CURSOR_VERSION;
  readonly generatedAt: string;
  readonly eventId: string;
}

export interface GenerationArchiveQuery {
  readonly academicYear: string;
  readonly documentType?: DocumentType;
  readonly pageSize: GenerationArchivePageSize;
  readonly cursor?: GenerationArchiveCursor;
}

export interface GenerationArchivePage<TEvent> {
  readonly items: readonly TEvent[];
  readonly pageSize: GenerationArchivePageSize;
  readonly hasMore: boolean;
  readonly nextCursor: GenerationArchiveCursor | null;
}

const eventIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function isGenerationArchiveCursor(value: unknown): value is GenerationArchiveCursor {
  if (!value || typeof value !== "object") return false;
  const cursor = value as Partial<GenerationArchiveCursor>;
  return cursor.version === GENERATION_ARCHIVE_CURSOR_VERSION &&
    typeof cursor.generatedAt === "string" &&
    !Number.isNaN(Date.parse(cursor.generatedAt)) &&
    typeof cursor.eventId === "string" &&
    eventIdPattern.test(cursor.eventId);
}

export function validateGenerationArchiveQuery(value: unknown): GenerationArchiveQuery {
  if (!value || typeof value !== "object") {
    throw new TypeError("Üretim arşivi sorgusu nesne olmalıdır.");
  }
  const query = value as Partial<GenerationArchiveQuery>;
  const academicYear = typeof query.academicYear === "string" ? query.academicYear : "";
  const match = /^(\d{4})-(\d{4})$/u.exec(academicYear);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new TypeError("Öğretim yılı filtresi geçersiz.");
  }
  if (!GENERATION_ARCHIVE_PAGE_SIZES.includes(query.pageSize as GenerationArchivePageSize)) {
    throw new TypeError("Üretim arşivi sayfa boyutu 20, 50 veya 100 olmalıdır.");
  }
  if (query.documentType !== undefined && !isDocumentType(query.documentType)) {
    throw new TypeError("Belge türü filtresi geçersiz.");
  }
  if (query.cursor !== undefined && !isGenerationArchiveCursor(query.cursor)) {
    throw new TypeError("Üretim arşivi imleci geçersiz.");
  }
  return Object.freeze({
    academicYear,
    pageSize: query.pageSize as GenerationArchivePageSize,
    ...(query.documentType ? { documentType: query.documentType } : {}),
    ...(query.cursor ? { cursor: Object.freeze({ ...query.cursor }) } : {}),
  });
}
