import {
  isDocumentType,
  type DocumentType,
} from "./document-generation-service.js";

export const GENERATION_ARCHIVE_CURSOR_VERSION = "1.1.0" as const;
export const GENERATION_ARCHIVE_CURSOR_VERSIONS = Object.freeze([
  "1.0.0",
  GENERATION_ARCHIVE_CURSOR_VERSION,
] as const);
export const GENERATION_ARCHIVE_PAGE_SIZES = Object.freeze([20, 50, 100] as const);

export type GenerationArchivePageSize = (typeof GENERATION_ARCHIVE_PAGE_SIZES)[number];
export type GenerationArchiveCursorVersion = (typeof GENERATION_ARCHIVE_CURSOR_VERSIONS)[number];

export interface FullAcademicYearExportQueryScope {
  readonly type: "academic-year";
  readonly academicYear: string;
  readonly documentType?: DocumentType;
}

export interface SearchResultsExportQueryScope {
  readonly type: "search-results";
  readonly documentType?: DocumentType;
  readonly curriculumSource?: string;
  readonly eventId?: string;
  readonly decisionId?: string;
  readonly requestId?: string;
  readonly recordId?: string;
}

export type GenerationArchiveQueryScope =
  | FullAcademicYearExportQueryScope
  | SearchResultsExportQueryScope;

export interface LegacyGenerationArchiveCursor {
  readonly version: "1.0.0";
  readonly generatedAt: string;
  readonly eventId: string;
}

export interface ScopedGenerationArchiveCursor {
  readonly version: typeof GENERATION_ARCHIVE_CURSOR_VERSION;
  readonly generatedAt: string;
  readonly eventId: string;
  readonly queryScope: GenerationArchiveQueryScope;
}

export type GenerationArchiveCursor =
  | LegacyGenerationArchiveCursor
  | ScopedGenerationArchiveCursor;

export interface LegacyGenerationArchiveQuery {
  readonly academicYear: string;
  readonly documentType?: DocumentType;
  readonly pageSize: GenerationArchivePageSize;
  readonly cursor?: GenerationArchiveCursor;
}

export interface ScopedGenerationArchiveQuery {
  readonly pageSize: GenerationArchivePageSize;
  readonly queryScope: GenerationArchiveQueryScope;
  readonly cursor?: GenerationArchiveCursor;
}

export type GenerationArchiveQuery =
  | LegacyGenerationArchiveQuery
  | ScopedGenerationArchiveQuery;

export interface GenerationArchivePage<TEvent> {
  readonly items: readonly TEvent[];
  readonly pageSize: GenerationArchivePageSize;
  readonly hasMore: boolean;
  readonly nextCursor: GenerationArchiveCursor | null;
}

const eventIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const prefixValuePattern = /^\S{3,}$/u;

const normalizeQueryScope = (scope: GenerationArchiveQueryScope): string => {
  if (scope.type === "academic-year") {
    return JSON.stringify({
      type: scope.type,
      academicYear: scope.academicYear,
      documentType: scope.documentType ?? null,
    });
  }

  return JSON.stringify({
    type: scope.type,
    documentType: scope.documentType ?? null,
    curriculumSource: scope.curriculumSource ?? null,
    eventId: scope.eventId ?? null,
    decisionId: scope.decisionId ?? null,
    requestId: scope.requestId ?? null,
    recordId: scope.recordId ?? null,
  });
};

const requirePrefixValue = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new TypeError(`${field} dizesi olmalıdır.`);
  }
  const normalized = value.trim();
  if (!prefixValuePattern.test(normalized)) {
    throw new TypeError(`${field} en az 3 karakter olmalı ve boşluk içermemelidir.`);
  }
  return normalized;
};

const requireExactString = (value: unknown, field: string): string => {
  if (typeof value !== "string") {
    throw new TypeError(`${field} dizesi olmalıdır.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${field} boş olamaz.`);
  }
  return normalized;
};

const isLegacyCursor = (value: Partial<GenerationArchiveCursor>): value is LegacyGenerationArchiveCursor =>
  value.version === "1.0.0";

const isSearchResultsExportQueryScope = (value: unknown): value is SearchResultsExportQueryScope =>
  isGenerationArchiveQueryScope(value) && value.type === "search-results";

const isScopedCursor = (value: Partial<GenerationArchiveCursor>): value is ScopedGenerationArchiveCursor =>
  value.version === GENERATION_ARCHIVE_CURSOR_VERSION;

export function isGenerationArchiveCursor(value: unknown): value is GenerationArchiveCursor {
  if (!value || typeof value !== "object") return false;
  const cursor = value as Partial<GenerationArchiveCursor>;

  if (cursor.version === "1.0.0") {
    return (
      typeof cursor.generatedAt === "string" &&
      !Number.isNaN(Date.parse(cursor.generatedAt)) &&
      typeof cursor.eventId === "string" &&
      eventIdPattern.test(cursor.eventId)
    );
  }

  if (cursor.version === GENERATION_ARCHIVE_CURSOR_VERSION) {
    return (
      typeof cursor.generatedAt === "string" &&
      !Number.isNaN(Date.parse(cursor.generatedAt)) &&
      typeof cursor.eventId === "string" &&
      eventIdPattern.test(cursor.eventId) &&
      cursor.queryScope !== undefined &&
      isGenerationArchiveQueryScope(cursor.queryScope)
    );
  }

  return false;
}

export function isGenerationArchiveQueryScope(value: unknown): value is GenerationArchiveQueryScope {
  if (!value || typeof value !== "object") return false;
  const scope = value as Partial<GenerationArchiveQueryScope>;

  if (scope.type === "academic-year") {
    return (
      typeof scope.academicYear === "string" &&
      /^\d{4}-\d{4}$/u.test(scope.academicYear) &&
      (scope.documentType === undefined || isDocumentType(scope.documentType))
    );
  }

  if (scope.type === "search-results") {
    return (
      (scope.documentType === undefined || isDocumentType(scope.documentType)) &&
      (scope.curriculumSource === undefined || typeof scope.curriculumSource === "string") &&
      (scope.eventId === undefined || typeof scope.eventId === "string") &&
      (scope.decisionId === undefined || typeof scope.decisionId === "string") &&
      (scope.requestId === undefined || typeof scope.requestId === "string") &&
      (scope.recordId === undefined || typeof scope.recordId === "string")
    );
  }

  return false;
}

const requireAcademicYear = (academicYear: unknown): string => {
  if (typeof academicYear !== "string") {
    throw new TypeError("Öğretim yılı filtresi dize olmalıdır.");
  }
  const normalized = academicYear.trim();
  const match = /^(\d{4})-(\d{4})$/u.exec(normalized);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new TypeError("Öğretim yılı filtresi geçersiz.");
  }
  return normalized;
};

const validateScopedQueryScope = (scope: unknown): GenerationArchiveQueryScope => {
  if (!isGenerationArchiveQueryScope(scope)) {
    throw new TypeError("QueryScope geçersiz.");
  }

  if (scope.type === "academic-year") {
    return Object.freeze({
      ...scope,
      academicYear: requireAcademicYear(scope.academicYear),
      ...(scope.documentType ? { documentType: scope.documentType } : {}),
    });
  }

  const searchScope = scope as SearchResultsExportQueryScope;
  return Object.freeze({
    ...searchScope,
    ...(searchScope.documentType ? { documentType: searchScope.documentType } : {}),
    ...(searchScope.curriculumSource ? { curriculumSource: requireExactString(searchScope.curriculumSource, "Müfredat kaynağı") } : {}),
    ...(searchScope.eventId ? { eventId: requirePrefixValue(searchScope.eventId, "Olay kimliği") } : {}),
    ...(searchScope.decisionId ? { decisionId: requirePrefixValue(searchScope.decisionId, "Karar kimliği") } : {}),
    ...(searchScope.requestId ? { requestId: requirePrefixValue(searchScope.requestId, "İstek kimliği") } : {}),
    ...(searchScope.recordId ? { recordId: requirePrefixValue(searchScope.recordId, "Kayıt kimliği") } : {}),
  });
};

export function validateGenerationArchiveQuery(value: unknown): GenerationArchiveQuery {
  if (!value || typeof value !== "object") {
    throw new TypeError("Üretim arşivi sorgusu nesne olmalıdır.");
  }

  const query = value as {
    pageSize?: unknown;
    cursor?: unknown;
    queryScope?: unknown;
    academicYear?: unknown;
    documentType?: unknown;
  };

  const pageSize = query.pageSize as GenerationArchivePageSize;
  if (!GENERATION_ARCHIVE_PAGE_SIZES.includes(pageSize)) {
    throw new TypeError("Üretim arşivi sayfa boyutu 20, 50 veya 100 olmalıdır.");
  }

  const cursor = query.cursor;
  if (cursor !== undefined && !isGenerationArchiveCursor(cursor)) {
    throw new TypeError("Üretim arşivi imleci geçersiz.");
  }

  if (query.queryScope !== undefined) {
    const queryScope = validateScopedQueryScope(query.queryScope);

    if (cursor !== undefined) {
      if (!isScopedCursor(cursor)) {
        throw new TypeError("İmleç sorgu kapsamına bağlı olmalıdır.");
      }
      if (normalizeQueryScope(cursor.queryScope) !== normalizeQueryScope(queryScope)) {
        throw new TypeError("İmleç, sorgu kapsamı değiştiğinde reddedildi.");
      }
    }

    return Object.freeze({
      pageSize,
      queryScope,
      ...(cursor ? { cursor: Object.freeze({ ...cursor }) } : {}),
    });
  }

  const academicYear = requireAcademicYear(query.academicYear);
  const documentType = query.documentType as unknown;
  if (documentType !== undefined && !isDocumentType(documentType as string)) {
    throw new TypeError("Belge türü filtresi geçersiz.");
  }

  if (cursor !== undefined && isScopedCursor(cursor)) {
    throw new TypeError("İmleç sorgu kapsamına bağlı olmalıdır.");
  }

  return Object.freeze({
    academicYear,
    pageSize,
    ...(documentType ? { documentType: documentType as DocumentType } : {}),
    ...(cursor ? { cursor: Object.freeze({ ...cursor }) } : {}),
  });
}
