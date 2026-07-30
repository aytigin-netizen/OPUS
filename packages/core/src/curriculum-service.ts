import type {
  Curriculum,
  CurriculumUnit,
  GradeLevel,
  LearningOutcome,
} from "@opus/curriculum";

import { ModuleLoader } from "./module-loader.js";

export interface CurriculumReference {
  readonly moduleId: string;
  readonly curriculumId: string;
}

export interface GradeReference extends CurriculumReference {
  readonly gradeLevelId: string;
}

export interface UnitReference extends GradeReference {
  readonly unitId: string;
}

export interface OutcomeReference extends UnitReference {
  readonly outcomeCode: string;
}

export type CurriculumServiceErrorCode =
  | "MODULE_NOT_ENABLED"
  | "CURRICULUM_NOT_FOUND"
  | "GRADE_LEVEL_NOT_FOUND"
  | "UNIT_NOT_FOUND"
  | "OUTCOME_NOT_FOUND"
  | "OUTCOME_UNIT_MISMATCH"
  | "OUTCOME_GRADE_MISMATCH";

export class CurriculumServiceError extends Error {
  readonly code: CurriculumServiceErrorCode;

  constructor(code: CurriculumServiceErrorCode, message: string) {
    super(message);
    this.name = "CurriculumServiceError";
    this.code = code;
  }
}

export class CurriculumService {
  constructor(private readonly modules: ModuleLoader) {}

  getCurriculum(reference: CurriculumReference): Curriculum {
    this.#requireEnabled(reference.moduleId);
    const module = this.modules.get(reference.moduleId);
    const curriculum = module.curriculum.find(
      (candidate) => candidate.id === reference.curriculumId,
    );

    if (!curriculum) {
      throw new CurriculumServiceError(
        "CURRICULUM_NOT_FOUND",
        `Müfredat bulunamadı: ${reference.curriculumId}`,
      );
    }

    return curriculum;
  }

  listGradeLevels(reference: CurriculumReference): readonly GradeLevel[] {
    return this.getCurriculum(reference).gradeLevels;
  }

  getGradeLevel(reference: GradeReference): GradeLevel {
    const gradeLevel = this.getCurriculum(reference).gradeLevels.find(
      (candidate) => candidate.id === reference.gradeLevelId,
    );

    if (!gradeLevel) {
      throw new CurriculumServiceError(
        "GRADE_LEVEL_NOT_FOUND",
        `Sınıf düzeyi bulunamadı: ${reference.gradeLevelId}`,
      );
    }

    return gradeLevel;
  }

  listUnits(reference: GradeReference): readonly CurriculumUnit[] {
    this.getGradeLevel(reference);
    return this.getCurriculum(reference).units.filter((unit) =>
      unit.gradeLevelIds.includes(reference.gradeLevelId),
    );
  }

  getUnit(reference: UnitReference): CurriculumUnit {
    this.getGradeLevel(reference);
    const unit = this.getCurriculum(reference).units.find(
      (candidate) => candidate.id === reference.unitId,
    );

    if (!unit || !unit.gradeLevelIds.includes(reference.gradeLevelId)) {
      throw new CurriculumServiceError(
        "UNIT_NOT_FOUND",
        `Ünite ${reference.gradeLevelId} sınıf düzeyinde bulunamadı: ${reference.unitId}`,
      );
    }

    return unit;
  }

  listOutcomes(reference: UnitReference): readonly LearningOutcome[] {
    const unit = this.getUnit(reference);
    const outcomeIds = new Set(unit.outcomeIds);
    return this.getCurriculum(reference).outcomes.filter((outcome) =>
      outcomeIds.has(outcome.id),
    );
  }

  getOutcome(reference: OutcomeReference): LearningOutcome {
    const unit = this.getUnit(reference);
    const outcome = this.getCurriculum(reference).outcomes.find(
      (candidate) => candidate.code === reference.outcomeCode,
    );

    if (!outcome) {
      throw new CurriculumServiceError(
        "OUTCOME_NOT_FOUND",
        `Öğrenme çıktısı bulunamadı: ${reference.outcomeCode}`,
      );
    }

    if (outcome.unitId !== unit.id || !unit.outcomeIds.includes(outcome.id)) {
      throw new CurriculumServiceError(
        "OUTCOME_UNIT_MISMATCH",
        `${reference.outcomeCode} öğrenme çıktısı ${reference.unitId} ünitesine ait değil.`,
      );
    }

    if (!outcome.gradeLevelIds.includes(reference.gradeLevelId)) {
      throw new CurriculumServiceError(
        "OUTCOME_GRADE_MISMATCH",
        `${reference.outcomeCode} öğrenme çıktısı ${reference.gradeLevelId} sınıf düzeyine ait değil.`,
      );
    }

    return outcome;
  }

  #requireEnabled(moduleId: string): void {
    const snapshot = this.modules.getSnapshot(moduleId);

    if (snapshot.status !== "enabled") {
      throw new CurriculumServiceError(
        "MODULE_NOT_ENABLED",
        `Müfredat sorgusu için modül etkin olmalıdır: ${moduleId}`,
      );
    }
  }
}
