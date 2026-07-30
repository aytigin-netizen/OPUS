import {
  CurriculumSchema,
  IdentifierSchema,
  LearningOutcomeKindSchema,
  type Curriculum,
  type CurriculumUnit,
  type LearningOutcome,
} from "@opus/curriculum";
import { z } from "zod";

const uniqueIdentifiers = (
  values: readonly string[],
  context: z.RefinementCtx,
  path: readonly PropertyKey[],
  label: string,
): void => {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    if (seen.has(value)) {
      context.addIssue({
        code: "custom",
        path: [...path, index],
        message: `${label} tekrar ediyor: ${value}`,
      });
    }
    seen.add(value);
  });
};

export const AssessmentDefinitionSchema = z.object({
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(200),
  supportedOutcomeKinds: z.array(LearningOutcomeKindSchema).min(1),
});

export const DocumentFormatSchema = z.enum(["docx", "pdf", "xlsx", "html"]);

export const DocumentDefinitionSchema = z.object({
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(200),
  formats: z.array(DocumentFormatSchema).min(1),
});

export const AIRuleSchema = z.object({
  id: IdentifierSchema,
  description: z.string().trim().min(1).max(1_000),
  effect: z.enum(["allow", "require", "forbid"]),
});

export const AIRuleSetSchema = z.object({
  version: z.string().trim().min(1).max(100),
  rules: z.array(AIRuleSchema).min(1),
});

export const ReportDefinitionSchema = z.object({
  id: IdentifierSchema,
  name: z.string().trim().min(1).max(200),
  requiredData: z.array(IdentifierSchema),
});

export const OpusModuleSchema = z
  .object({
    contractVersion: z.literal("1.0.0"),
    id: IdentifierSchema,
    name: z.string().trim().min(1).max(200),
    subjectIds: z.array(IdentifierSchema).min(1),
    curriculum: z.array(CurriculumSchema).min(1),
    assessment: z.array(AssessmentDefinitionSchema).min(1),
    documents: z.array(DocumentDefinitionSchema),
    ai_rules: AIRuleSetSchema,
    reports: z.array(ReportDefinitionSchema),
  })
  .superRefine((module, context) => {
    uniqueIdentifiers(module.subjectIds, context, ["subjectIds"], "Branş kimliği");

    const curriculumIds = module.curriculum.map((curriculum) => curriculum.id);
    uniqueIdentifiers(
      curriculumIds,
      context,
      ["curriculum"],
      "Müfredat kimliği",
    );

    module.curriculum.forEach((curriculum, index) => {
      if (!module.subjectIds.includes(curriculum.subjectId)) {
        context.addIssue({
          code: "custom",
          path: ["curriculum", index, "subjectId"],
          message: `Müfredat branşı modül tarafından tanımlanmıyor: ${curriculum.subjectId}`,
        });
      }
    });

    uniqueIdentifiers(
      module.assessment.map((definition) => definition.id),
      context,
      ["assessment"],
      "Değerlendirme kimliği",
    );
    uniqueIdentifiers(
      module.documents.map((definition) => definition.id),
      context,
      ["documents"],
      "Doküman kimliği",
    );
    uniqueIdentifiers(
      module.ai_rules.rules.map((rule) => rule.id),
      context,
      ["ai_rules", "rules"],
      "AI kural kimliği",
    );
    uniqueIdentifiers(
      module.reports.map((definition) => definition.id),
      context,
      ["reports"],
      "Rapor kimliği",
    );
  });

export type AssessmentDefinition = z.infer<typeof AssessmentDefinitionSchema>;
export type DocumentFormat = z.infer<typeof DocumentFormatSchema>;
export type DocumentDefinition = z.infer<typeof DocumentDefinitionSchema>;
export type AIRule = z.infer<typeof AIRuleSchema>;
export type AIRuleSet = z.infer<typeof AIRuleSetSchema>;
export type ReportDefinition = z.infer<typeof ReportDefinitionSchema>;
export type OpusModule = z.infer<typeof OpusModuleSchema>;

export interface LoadedModule extends OpusModule {
  readonly units: readonly CurriculumUnit[];
  readonly outcomes: readonly LearningOutcome[];
}

export function parseOpusModule(input: unknown): OpusModule {
  return OpusModuleSchema.parse(input);
}

export function collectUnits(
  curricula: readonly Curriculum[],
): readonly CurriculumUnit[] {
  return curricula.flatMap((curriculum) => curriculum.units);
}

export function collectOutcomes(
  curricula: readonly Curriculum[],
): readonly LearningOutcome[] {
  return curricula.flatMap((curriculum) => curriculum.outcomes);
}
