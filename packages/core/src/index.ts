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
