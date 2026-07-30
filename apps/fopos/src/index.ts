import { parseOpusModule, type OpusModule } from "@opus/core";

import { legacyPhilosophyUnits } from "./legacy-curriculum-data.js";

const gradeLevels = [
  { id: "grade-10", label: "10. sınıf", sequence: 10 },
  { id: "grade-11", label: "11. sınıf", sequence: 11 },
];

const unitId = (code: string): string =>
  code.toLocaleLowerCase("en-US").replaceAll("_", "-");

const outcomeId = (code: string): string =>
  code.toLocaleLowerCase("en-US").replaceAll(".", "-");

const units = legacyPhilosophyUnits.map((unit, index) => ({
  id: unitId(unit.code),
  sequence: index + 1,
  title: unit.name,
  description: unit.purpose,
  gradeLevelIds: [`grade-${unit.grade}`],
  estimatedPeriods: unit.hours,
  outcomeIds: unit.outcomes.map((outcome) => outcomeId(outcome.code)),
}));

const outcomes = legacyPhilosophyUnits.flatMap((unit) =>
  unit.outcomes.map((outcome) => ({
    id: outcomeId(outcome.code),
    code: outcome.code,
    unitId: unitId(unit.code),
    title: outcome.description,
    description: outcome.description,
    gradeLevelIds: [`grade-${unit.grade}`],
    kind: "integrated" as const,
    evidenceHints: [],
  })),
);

const moduleCandidate = {
  contractVersion: "1.0.0",
  id: "fopos",
  name: "FOPOS — Felsefe",
  subjectIds: ["philosophy"],
  curriculum: [
    {
      schemaVersion: "1.0.0",
      id: "philosophy-tr-2024",
      subjectId: "philosophy",
      title: "Türkiye Yüzyılı Maarif Modeli Ortaöğretim Felsefe Dersi Öğretim Programı",
      countryCode: "TR",
      languageTag: "tr-TR",
      version: "2024.1",
      status: "active",
      effectiveFrom: "2024-09-01",
      effectiveTo: null,
      source: {
        authority: "T.C. Millî Eğitim Bakanlığı",
        title: "Ortaöğretim Felsefe Dersi Öğretim Programı",
        documentVersion: "2024",
        publishedAt: "2024-01-01",
      },
      gradeLevels,
      units,
      outcomes,
    },
  ],
  assessment: [
    {
      id: "process-and-product-assessment",
      name: "Süreç ve ürün odaklı değerlendirme",
      supportedOutcomeKinds: ["integrated"],
    },
  ],
  documents: [
    {
      id: "lesson-plan",
      name: "Felsefe ders planı",
      formats: ["docx", "pdf"],
    },
    {
      id: "assessment-form",
      name: "Felsefe değerlendirme formu",
      formats: ["docx", "pdf", "xlsx"],
    },
  ],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "curriculum-first",
        description:
          "Müfredatla ilgili üretimlerde yalnızca modülün kanonik veri setini esas al.",
        effect: "require",
      },
      {
        id: "preserve-philosophical-plurality",
        description:
          "Tartışmalı felsefi problemlerde tek bir görüşü zorunlu doğru olarak sunma.",
        effect: "forbid",
      },
      {
        id: "require-reasoning",
        description:
          "Öğrenci görevlerinde iddia, gerekçe ve karşı görüş bağlantısını görünür kıl.",
        effect: "require",
      },
    ],
  },
  reports: [
    {
      id: "outcome-progress",
      name: "Felsefe öğrenme çıktısı ilerleme raporu",
      requiredData: ["outcome-results"],
    },
  ],
} as const satisfies OpusModule;

export const foposModule: OpusModule = parseOpusModule(moduleCandidate);

export {
  createFoposCurriculumAdapter,
  type FoposCurriculumAdapter,
} from "./curriculum-adapter.js";

export {
  createFoposPedagogicalAdapter,
  type FoposPedagogicalAdapter,
  type FoposPedagogicalRequest,
} from "./pedagogical-adapter.js";
