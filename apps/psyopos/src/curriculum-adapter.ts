import {
  CurriculumService,
  ModuleLoader,
  type CurriculumUnit,
  type GradeLevel,
  type LearningOutcome,
} from "@opus/core";

import { psyoposModule } from "./index.js";

const PSYOPOS_CONTEXT = Object.freeze({
  moduleId: "psyopos",
  curriculumId: "psychology-tr-2026",
  gradeLevelId: "secondary-education",
});

export interface PsyoposCurriculumAdapter {
  getEducationLevel(): GradeLevel;
  listUnits(): readonly CurriculumUnit[];
  getUnit(unitId: string): CurriculumUnit;
  listOutcomes(unitId: string): readonly LearningOutcome[];
  getOutcome(unitId: string, outcomeCode: string): LearningOutcome;
}

export function createPsyoposCurriculumAdapter(): PsyoposCurriculumAdapter {
  const modules = new ModuleLoader();
  modules.register(psyoposModule);
  modules.enable(psyoposModule.id);
  const service = new CurriculumService(modules);

  return Object.freeze({
    getEducationLevel: () => service.getGradeLevel(PSYOPOS_CONTEXT),
    listUnits: () => service.listUnits(PSYOPOS_CONTEXT),
    getUnit: (unitId: string) =>
      service.getUnit({
        ...PSYOPOS_CONTEXT,
        unitId,
      }),
    listOutcomes: (unitId: string) =>
      service.listOutcomes({
        ...PSYOPOS_CONTEXT,
        unitId,
      }),
    getOutcome: (unitId: string, outcomeCode: string) =>
      service.getOutcome({
        ...PSYOPOS_CONTEXT,
        unitId,
        outcomeCode,
      }),
  });
}
