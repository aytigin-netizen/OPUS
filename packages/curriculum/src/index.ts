export {
  CurriculumSchema,
  CurriculumStatusSchema,
  CurriculumUnitSchema,
  GradeLevelSchema,
  IdentifierSchema,
  IsoDateSchema,
  LearningOutcomeKindSchema,
  LearningOutcomeSchema,
  SourceReferenceSchema,
} from "./schema.js";

export type {
  Curriculum,
  CurriculumStatus,
  CurriculumUnit,
  GradeLevel,
  LearningOutcome,
  LearningOutcomeKind,
  SourceReference,
} from "./schema.js";

export {
  createCurriculumIndex,
  isCurriculumEffectiveOn,
  parseCurriculum,
  validateCurriculum,
} from "./engine.js";

export type {
  CurriculumIndex,
  CurriculumValidationResult,
} from "./engine.js";
