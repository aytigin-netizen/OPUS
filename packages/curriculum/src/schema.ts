import { z } from "zod";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IDENTIFIER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_TAG_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

export const IdentifierSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    IDENTIFIER_PATTERN,
    "Kimlik yalnızca küçük harf, sayı ve tek tire ayırıcıları içerebilir.",
  );

export const IsoDateSchema = z
  .string()
  .refine(isValidIsoDate, "Tarih YYYY-AA-GG biçiminde geçerli bir ISO tarihi olmalıdır.");

export const GradeLevelSchema = z.object({
  id: IdentifierSchema,
  label: z.string().trim().min(1).max(100),
  sequence: z.number().int().nonnegative(),
});

export const SourceReferenceSchema = z.object({
  authority: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  documentVersion: z.string().trim().min(1).max(100),
  publishedAt: IsoDateSchema,
  url: z.url().optional(),
  retrievedAt: IsoDateSchema.optional(),
});

export const LearningOutcomeKindSchema = z.enum([
  "knowledge",
  "skill",
  "value",
  "integrated",
]);

export const LearningOutcomeSchema = z.object({
  id: IdentifierSchema,
  code: z.string().trim().min(1).max(100),
  unitId: IdentifierSchema,
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(2_000),
  gradeLevelIds: z.array(IdentifierSchema).min(1),
  kind: LearningOutcomeKindSchema,
  evidenceHints: z.array(z.string().trim().min(1).max(500)).default([]),
});

export const CurriculumUnitSchema = z.object({
  id: IdentifierSchema,
  sequence: z.number().int().positive(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(2_000).optional(),
  gradeLevelIds: z.array(IdentifierSchema).min(1),
  estimatedPeriods: z.number().int().positive(),
  outcomeIds: z.array(IdentifierSchema).min(1),
});

export const CurriculumStatusSchema = z.enum(["draft", "active", "retired"]);

export const CurriculumSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    id: IdentifierSchema,
    subjectId: IdentifierSchema,
    title: z.string().trim().min(1).max(300),
    countryCode: z.string().length(2).transform((value) => value.toUpperCase()),
    languageTag: z
      .string()
      .regex(LANGUAGE_TAG_PATTERN, "Dil etiketi tr veya tr-TR gibi olmalıdır."),
    version: z.string().trim().min(1).max(100),
    status: CurriculumStatusSchema,
    effectiveFrom: IsoDateSchema,
    effectiveTo: IsoDateSchema.nullable().default(null),
    source: SourceReferenceSchema,
    gradeLevels: z.array(GradeLevelSchema).min(1),
    units: z.array(CurriculumUnitSchema).min(1),
    outcomes: z.array(LearningOutcomeSchema).min(1),
  })
  .superRefine((curriculum, context) => {
    if (
      curriculum.effectiveTo !== null &&
      curriculum.effectiveTo < curriculum.effectiveFrom
    ) {
      context.addIssue({
        code: "custom",
        path: ["effectiveTo"],
        message: "Bitiş tarihi başlangıç tarihinden önce olamaz.",
      });
    }

    const gradeLevelIds = new Set<string>();
    curriculum.gradeLevels.forEach((gradeLevel, index) => {
      if (gradeLevelIds.has(gradeLevel.id)) {
        context.addIssue({
          code: "custom",
          path: ["gradeLevels", index, "id"],
          message: `Sınıf düzeyi kimliği tekrar ediyor: ${gradeLevel.id}`,
        });
      }
      gradeLevelIds.add(gradeLevel.id);
    });

    const unitIds = new Set<string>();
    const unitSequences = new Set<number>();
    curriculum.units.forEach((unit, index) => {
      if (unitIds.has(unit.id)) {
        context.addIssue({
          code: "custom",
          path: ["units", index, "id"],
          message: `Ünite kimliği tekrar ediyor: ${unit.id}`,
        });
      }
      unitIds.add(unit.id);

      if (unitSequences.has(unit.sequence)) {
        context.addIssue({
          code: "custom",
          path: ["units", index, "sequence"],
          message: `Ünite sıra numarası tekrar ediyor: ${unit.sequence}`,
        });
      }
      unitSequences.add(unit.sequence);

      const localOutcomeIds = new Set<string>();
      unit.outcomeIds.forEach((outcomeId, outcomeIndex) => {
        if (localOutcomeIds.has(outcomeId)) {
          context.addIssue({
            code: "custom",
            path: ["units", index, "outcomeIds", outcomeIndex],
            message: `Ünite içinde öğrenme çıktısı tekrar ediyor: ${outcomeId}`,
          });
        }
        localOutcomeIds.add(outcomeId);
      });

      unit.gradeLevelIds.forEach((gradeLevelId, gradeIndex) => {
        if (!gradeLevelIds.has(gradeLevelId)) {
          context.addIssue({
            code: "custom",
            path: ["units", index, "gradeLevelIds", gradeIndex],
            message: `Tanımsız sınıf düzeyi: ${gradeLevelId}`,
          });
        }
      });
    });

    const outcomeIds = new Set<string>();
    const outcomeCodes = new Set<string>();
    curriculum.outcomes.forEach((outcome, index) => {
      if (outcomeIds.has(outcome.id)) {
        context.addIssue({
          code: "custom",
          path: ["outcomes", index, "id"],
          message: `Öğrenme çıktısı kimliği tekrar ediyor: ${outcome.id}`,
        });
      }
      outcomeIds.add(outcome.id);

      if (outcomeCodes.has(outcome.code)) {
        context.addIssue({
          code: "custom",
          path: ["outcomes", index, "code"],
          message: `Öğrenme çıktısı kodu tekrar ediyor: ${outcome.code}`,
        });
      }
      outcomeCodes.add(outcome.code);

      if (!unitIds.has(outcome.unitId)) {
        context.addIssue({
          code: "custom",
          path: ["outcomes", index, "unitId"],
          message: `Tanımsız ünite: ${outcome.unitId}`,
        });
      }

      outcome.gradeLevelIds.forEach((gradeLevelId, gradeIndex) => {
        if (!gradeLevelIds.has(gradeLevelId)) {
          context.addIssue({
            code: "custom",
            path: ["outcomes", index, "gradeLevelIds", gradeIndex],
            message: `Tanımsız sınıf düzeyi: ${gradeLevelId}`,
          });
        }
      });
    });

    curriculum.units.forEach((unit, unitIndex) => {
      unit.outcomeIds.forEach((outcomeId, outcomeIndex) => {
        const outcome = curriculum.outcomes.find((item) => item.id === outcomeId);
        if (!outcome) {
          context.addIssue({
            code: "custom",
            path: ["units", unitIndex, "outcomeIds", outcomeIndex],
            message: `Tanımsız öğrenme çıktısı: ${outcomeId}`,
          });
          return;
        }

        if (outcome.unitId !== unit.id) {
          context.addIssue({
            code: "custom",
            path: ["units", unitIndex, "outcomeIds", outcomeIndex],
            message: `${outcomeId} çıktısı ${outcome.unitId} ünitesine aittir.`,
          });
        }
      });
    });

    curriculum.outcomes.forEach((outcome, outcomeIndex) => {
      const owner = curriculum.units.find((unit) => unit.id === outcome.unitId);
      if (owner && !owner.outcomeIds.includes(outcome.id)) {
        context.addIssue({
          code: "custom",
          path: ["outcomes", outcomeIndex, "id"],
          message: `${outcome.id} çıktısı bağlı olduğu ünitenin outcomeIds listesinde bulunmuyor.`,
        });
      }
    });
  });

export type GradeLevel = z.infer<typeof GradeLevelSchema>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;
export type LearningOutcomeKind = z.infer<typeof LearningOutcomeKindSchema>;
export type LearningOutcome = z.infer<typeof LearningOutcomeSchema>;
export type CurriculumUnit = z.infer<typeof CurriculumUnitSchema>;
export type CurriculumStatus = z.infer<typeof CurriculumStatusSchema>;
export type Curriculum = z.infer<typeof CurriculumSchema>;
