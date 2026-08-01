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
  ARTIFACT_INTEGRITY_ALGORITHM,
  ARTIFACT_INTEGRITY_SOURCE,
  DOCUMENT_TYPES,
  DocumentGenerationError,
  DocumentGenerationService,
  isArtifactIntegrity,
  isDocumentType,
} from "./document-generation-service.js";

export type {
  ArtifactIntegrity,
  DocumentGenerationContext,
  DocumentGenerationErrorCode,
  DocumentGenerationRequest,
  DocumentGenerator,
  DocumentType,
  GeneratedDocument,
  GenerationProvenance,
} from "./document-generation-service.js";
