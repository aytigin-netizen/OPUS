import { parseOpusModule, type OpusModule } from "@opus/core";

const GRADE_LEVEL_ID = "secondary-education";

const outcomes = [
  {
    code: "PSK.1.1",
    unitId: "psk-u1",
    title: "Psikolojinin tanımı, konusu ve temel bileşenlerini çözümleyebilme",
  },
  {
    code: "PSK.2.1",
    unitId: "psk-u2",
    title:
      "Gelişim psikolojisinin temel kavramlarını, gelişimi etkileyen etmenleri ve gelişimin ilkelerini özetleyebilme",
  },
  {
    code: "PSK.2.2",
    unitId: "psk-u2",
    title: "Gelişim dönemlerinde değişim ve sürekliliği algılayabilme",
  },
  {
    code: "PSK.2.3",
    unitId: "psk-u2",
    title: "İnsan zekâsı ile yapay zekâyı karşılaştırabilme",
  },
  {
    code: "PSK.2.4",
    unitId: "psk-u2",
    title: "Kişilik ve benlik-dijital benliği karşılaştırabilme",
  },
  {
    code: "PSK.3.1",
    unitId: "psk-u3",
    title: "Öğrenmenin temel kavramlarını çözümleyebilme",
  },
  {
    code: "PSK.3.2",
    unitId: "psk-u3",
    title: "Öğrenmeyi etkileyen etmenleri özetleyebilme",
  },
  {
    code: "PSK.3.3",
    unitId: "psk-u3",
    title: "Öğrenme yaklaşımlarını özetleyebilme",
  },
  {
    code: "PSK.3.4",
    unitId: "psk-u3",
    title: "İnsan öğrenmesi ile makine öğrenmesini karşılaştırabilme",
  },
  {
    code: "PSK.4.1",
    unitId: "psk-u4",
    title: "Uyum sorunlarını karşılaştırabilme",
  },
  {
    code: "PSK.4.2",
    unitId: "psk-u4",
    title: "Uyum sağlamaya yönelik yaklaşım ve becerileri yapılandırabilme",
  },
  {
    code: "PSK.4.3",
    unitId: "psk-u4",
    title:
      "Uyum sağlama sürecinde kullanılan maruz bırakma yönteminde sanal gerçeklik ve artırılmış gerçeklik uygulamalarının yeri ve önemine ilişkin eleştirel düşünebilme",
  },
  {
    code: "PSK.4.4",
    unitId: "psk-u4",
    title: "Tutum ve olumlu-olumsuz sosyal davranışları gözlemleyebilme",
  },
].map((outcome) => ({
  id: outcome.code.toLocaleLowerCase("en-US").replaceAll(".", "-"),
  code: outcome.code,
  unitId: outcome.unitId,
  title: outcome.title,
  description: outcome.title,
  gradeLevelIds: [GRADE_LEVEL_ID],
  kind: "integrated" as const,
  evidenceHints: [],
}));

const unitDefinitions = [
  {
    id: "psk-u1",
    title: "PSİKOLOJİ İLE TANIŞMA",
    description:
      "Psikoloji biliminin temel bileşenlerini ve bu bileşenler arasındaki ilişkileri ele alır.",
    estimatedPeriods: 10,
  },
  {
    id: "psk-u2",
    title: "GELİŞİMİ ANLAMAK",
    description:
      "Gelişimin temel kavramlarını, gelişim dönemlerini, insan ve yapay zekâyı, kişilik ile benlik-dijital benliği ele alır.",
    estimatedPeriods: 18,
  },
  {
    id: "psk-u3",
    title: "NASIL ÖĞRENİRİZ?",
    description:
      "Öğrenmenin temel kavramlarını, öğrenmeyi etkileyen etmenleri, öğrenme yaklaşımlarını ve makine öğrenmesini ele alır.",
    estimatedPeriods: 20,
  },
  {
    id: "psk-u4",
    title: "BİREYSEL VE SOSYAL UYUM",
    description:
      "Uyum sorunlarını, uyum sağlamaya yönelik yaklaşım ve becerileri, teknoloji destekli uygulamaları ve sosyal davranışları ele alır.",
    estimatedPeriods: 20,
  },
] as const;

const units = unitDefinitions.map((unit, index) => ({
  ...unit,
  sequence: index + 1,
  gradeLevelIds: [GRADE_LEVEL_ID],
  outcomeIds: outcomes
    .filter((outcome) => outcome.unitId === unit.id)
    .map((outcome) => outcome.id),
}));

const moduleCandidate = {
  contractVersion: "1.0.0",
  id: "psyopos",
  name: "PSYOPOS — Psikoloji",
  subjectIds: ["psychology"],
  curriculum: [
    {
      schemaVersion: "1.0.0",
      id: "psychology-tr-2026",
      subjectId: "psychology",
      title:
        "Türkiye Yüzyılı Maarif Modeli Ortaöğretim Psikoloji Dersi Öğretim Programı",
      countryCode: "TR",
      languageTag: "tr-TR",
      version: "2026.1",
      status: "active",
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      source: {
        authority: "T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı",
        title: "Ortaöğretim Psikoloji Dersi Öğretim Programı",
        documentVersion: "2026",
        publishedAt: "2026-06-25",
        url: "https://mufredat.meb.gov.tr/ProgramDetay.aspx?PID=2170",
        retrievedAt: "2026-07-31",
      },
      gradeLevels: [
        {
          id: GRADE_LEVEL_ID,
          label: "Ortaöğretim",
          sequence: 0,
        },
      ],
      units,
      outcomes,
    },
  ],
  assessment: [
    {
      id: "process-and-product-assessment",
      name: "Süreç ve ürün odaklı psikoloji değerlendirmesi",
      supportedOutcomeKinds: ["integrated"],
    },
  ],
  documents: [],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "curriculum-first",
        description:
          "Müfredatla ilgili üretimlerde yalnızca PSYOPOS'un kanonik veri setini esas al.",
        effect: "require",
      },
      {
        id: "forbid-automated-diagnosis",
        description:
          "Öğrenci davranışlarından otomatik psikolojik tanı, bozukluk veya tedavi kararı üretme.",
        effect: "forbid",
      },
      {
        id: "require-evidence-boundaries",
        description:
          "Psikolojiye ilişkin açıklamalarda bilimsel kanıt ile pedagojik örnek arasındaki sınırı görünür kıl.",
        effect: "require",
      },
      {
        id: "protect-psychological-privacy",
        description:
          "Öğrenciden hassas ruh sağlığı verisi isteme veya mahrem kişisel deneyimini açıklamaya zorlama.",
        effect: "forbid",
      },
    ],
  },
  reports: [],
} as const satisfies OpusModule;

export const psyoposModule: OpusModule = parseOpusModule(moduleCandidate);
