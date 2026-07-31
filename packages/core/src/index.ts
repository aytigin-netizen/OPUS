export {
  AIRuleSchema,
  AIRuleSetSchema,
  AssessmentDefinitionSchema,
  DocumentDefinitionSchema,
  DocumentFormatSchema,
  OpusModuleSchema,
  ReportDefinitionSchema,
  collectOutcomes,
  collectUnits,
  parseOpusModule,
} from "./module-contract.js";

export type {
  AIRule,
  AIRuleSet,
  AssessmentDefinition,
  DocumentDefinition,
  DocumentFormat,
  LoadedModule,
  OpusModule,
  ReportDefinition,
} from "./module-contract.js";

export { ModuleLoader, ModuleLoaderError } from "./module-loader.js";

export type {
  ModuleHealth,
  ModuleLoaderErrorCode,
  ModuleSnapshot,
  ModuleStatus,
} from "./module-loader.js";

export {
  CurriculumService,
  CurriculumServiceError,
} from "./curriculum-service.js";

export type {
  CurriculumReference,
  CurriculumServiceErrorCode,
  GradeReference,
  OutcomeReference,
  UnitReference,
} from "./curriculum-service.js";

export type {
  Curriculum,
  CurriculumUnit,
  GradeLevel,
  LearningOutcome,
} from "@opus/curriculum";

export {
  PedagogicalDecisionError,
  PedagogicalDecisionService,
} from "./pedagogical-decision-service.js";

export type {
  ApprovedPedagogicalDecision,
  DecisionTraceEntry,
  PedagogicalDecisionErrorCode,
  PedagogicalRequest,
  PendingPedagogicalDecision,
  ResolvedPedagogicalContext,
  TeacherApproval,
} from "./pedagogical-decision-service.js";

export {
  DocumentGenerationError,
  DocumentGenerationService,
} from "./document-generation-service.js";

export type {
  DocumentGenerationContext,
  DocumentGenerationErrorCode,
  DocumentGenerationRequest,
  DocumentGenerator,
  GeneratedDocument,
  GenerationProvenance,
} from "./document-generation-service.js";
