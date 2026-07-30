import {
  CurriculumService,
  ModuleLoader,
  type CurriculumUnit,
  type GradeLevel,
  type LearningOutcome,
} from "@opus/core";

import { foposModule } from "./index.js";

const FOPOS_CONTEXT = Object.freeze({
  moduleId: "fopos",
  curriculumId: "philosophy-tr-2024",
});

export interface FoposCurriculumAdapter {
  listGrades(): readonly GradeLevel[];
  listUnits(grade: 10 | 11): readonly CurriculumUnit[];
  getUnit(grade: 10 | 11, unitId: string): CurriculumUnit;
  listOutcomes(
    grade: 10 | 11,
    unitId: string,
  ): readonly LearningOutcome[];
  getOutcome(
    grade: 10 | 11,
    unitId: string,
    outcomeCode: string,
  ): LearningOutcome;
}

const gradeLevelId = (grade: 10 | 11): string => `grade-${grade}`;

export function createFoposCurriculumAdapter(): FoposCurriculumAdapter {
  const modules = new ModuleLoader();
  modules.register(foposModule);
  modules.enable(foposModule.id);
  const service = new CurriculumService(modules);

  return Object.freeze({
    listGrades: () => service.listGradeLevels(FOPOS_CONTEXT),
    listUnits: (grade: 10 | 11) =>
      service.listUnits({
        ...FOPOS_CONTEXT,
        gradeLevelId: gradeLevelId(grade),
      }),
    getUnit: (grade: 10 | 11, unitId: string) =>
      service.getUnit({
        ...FOPOS_CONTEXT,
        gradeLevelId: gradeLevelId(grade),
        unitId,
      }),
    listOutcomes: (grade: 10 | 11, unitId: string) =>
      service.listOutcomes({
        ...FOPOS_CONTEXT,
        gradeLevelId: gradeLevelId(grade),
        unitId,
      }),
    getOutcome: (
      grade: 10 | 11,
      unitId: string,
      outcomeCode: string,
    ) =>
      service.getOutcome({
        ...FOPOS_CONTEXT,
        gradeLevelId: gradeLevelId(grade),
        unitId,
        outcomeCode,
      }),
  });
}
