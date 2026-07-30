import type { z } from "zod";

import {
  CurriculumSchema,
  type Curriculum,
  type CurriculumUnit,
  type LearningOutcome,
} from "./schema.js";

export interface CurriculumIndex {
  curriculum: Curriculum;
  unitsById: ReadonlyMap<string, CurriculumUnit>;
  outcomesById: ReadonlyMap<string, LearningOutcome>;
  outcomesByCode: ReadonlyMap<string, LearningOutcome>;
}

export interface CurriculumValidationResult {
  success: boolean;
  issues: readonly z.core.$ZodIssue[];
}

export function parseCurriculum(input: unknown): Curriculum {
  return CurriculumSchema.parse(input);
}

export function validateCurriculum(input: unknown): CurriculumValidationResult {
  const result = CurriculumSchema.safeParse(input);

  return result.success
    ? { success: true, issues: [] }
    : { success: false, issues: result.error.issues };
}

export function createCurriculumIndex(input: unknown): CurriculumIndex {
  const curriculum = parseCurriculum(input);

  return {
    curriculum,
    unitsById: new Map(curriculum.units.map((unit) => [unit.id, unit])),
    outcomesById: new Map(
      curriculum.outcomes.map((outcome) => [outcome.id, outcome]),
    ),
    outcomesByCode: new Map(
      curriculum.outcomes.map((outcome) => [outcome.code, outcome]),
    ),
  };
}

export function isCurriculumEffectiveOn(
  curriculum: Curriculum,
  date: string,
): boolean {
  const effectiveTo = curriculum.effectiveTo;
  return (
    date >= curriculum.effectiveFrom &&
    (effectiveTo === null || date <= effectiveTo)
  );
}
