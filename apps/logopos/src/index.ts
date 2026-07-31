import { parseOpusModule, type OpusModule } from "@opus/core";

const GRADE_LEVEL_ID = "secondary-education";

const outcomes = ([
  ["MAN.1.1", "log-u1", "Mantığı formel bir bilim olarak sorgulayabilme"],
  ["MAN.1.2", "log-u1", "Mantığın tarihsel gelişim sürecini özetleyebilme"],
  ["MAN.1.3", "log-u1", "Mantığın temel kavramsal çerçevesini yapılandırabilme"],
  ["MAN.2.1", "log-u2", "Aristotelesçi mantıkta terimlere ilişkin özellikleri özetleyebilme"],
  ["MAN.2.2", "log-u2", "Önermeleri çözümleyebilme"],
  ["MAN.2.3", "log-u2", "Çıkarım çeşitlerini özetleyebilme"],
  ["MAN.3.1", "log-u3", "Aristotelesçi mantık ile sembolik mantığı temel özellikleri açısından karşılaştırabilme"],
  ["MAN.3.2", "log-u3", "Doğruluk değeri tablosunu çözümleyebilme"],
  ["MAN.3.3", "log-u3", "Önermelerin tutarlılığını, geçerliliğini ve eşdeğerliğini doğruluk değeri tablosu ile denetleyebilme"],
  ["MAN.3.4", "log-u3", "Çıkarımların geçerliliğini doğruluk değeri tablosu ile denetleyebilme"],
  ["MAN.3.5", "log-u3", "Niceleme mantığını yorumlayabilme"],
  ["MAN.4.1", "log-u4", "Mantık ve bilgi alanları arasındaki ilişkiyi yapılandırabilme"],
  ["MAN.4.2", "log-u4", "Mantık çeşitlerini karşılaştırabilme"],
  ["MAN.4.3", "log-u4", "Verilen bir görüşü mantıksal açıdan tartışabilme"],
  ["MAN.4.4", "log-u4", "İhtiyaçların karşılanmasında ve sorunların çözümünde mantıksal açıdan karar verebilme"],
  ["MAN.4.5", "log-u4", "Akıl yürütme biçimlerini verilen günlük hayat durumlarında uygulayabilme"],
  ["MAN.4.6", "log-u4", "Örnek metinleri mantıksal açıdan denetleyebilme"],
] as const).map(([code, unitId, title]) => ({
  id: code.toLocaleLowerCase("en-US").replaceAll(".", "-"),
  code,
  unitId,
  title,
  description: title,
  gradeLevelIds: [GRADE_LEVEL_ID],
  kind: "integrated" as const,
  evidenceHints: [],
}));

const unitDefinitions = [
  {
    id: "log-u1",
    title: "MANTIĞIN DOĞASI",
    description: "Mantığın formel bilim niteliğini, tarihsel gelişimini ve temel kavramsal çerçevesini ele alır.",
    estimatedPeriods: 10,
  },
  {
    id: "log-u2",
    title: "ARİSTOTELESÇİ MANTIK",
    description: "Aristotelesçi mantıkta terimleri, önermeleri ve çıkarım çeşitlerini ele alır.",
    estimatedPeriods: 16,
  },
  {
    id: "log-u3",
    title: "SEMBOLİK MANTIK",
    description: "Sembolik mantığın özelliklerini, doğruluk tablolarını ve niceleme mantığını ele alır.",
    estimatedPeriods: 16,
  },
  {
    id: "log-u4",
    title: "MANTIK ÇEŞİTLERİ VE UYGULAMALARI",
    description: "Mantık çeşitlerini, bilgi alanlarıyla ilişkisini ve günlük hayattaki uygulamalarını ele alır.",
    estimatedPeriods: 26,
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
  id: "logopos",
  name: "LOGOPOS — Mantık",
  subjectIds: ["logic"],
  curriculum: [
    {
      schemaVersion: "1.0.0",
      id: "logic-tr-2026",
      subjectId: "logic",
      title: "Türkiye Yüzyılı Maarif Modeli Ortaöğretim Mantık Dersi Öğretim Programı",
      countryCode: "TR",
      languageTag: "tr-TR",
      version: "2026.1",
      status: "active",
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      source: {
        authority: "T.C. Millî Eğitim Bakanlığı Talim ve Terbiye Kurulu Başkanlığı",
        title: "Ortaöğretim Mantık Dersi Öğretim Programı",
        documentVersion: "2026",
        publishedAt: "2026-06-25",
        url: "https://mufredat.meb.gov.tr/ProgramDetay.aspx?PID=2172",
        retrievedAt: "2026-07-31",
      },
      gradeLevels: [
        { id: GRADE_LEVEL_ID, label: "Ortaöğretim", sequence: 0 },
      ],
      units,
      outcomes,
    },
  ],
  assessment: [
    {
      id: "logical-reasoning-assessment",
      name: "Mantıksal akıl yürütme süreç ve ürün değerlendirmesi",
      supportedOutcomeKinds: ["integrated"],
    },
  ],
  documents: [],
  ai_rules: {
    version: "1.0.0",
    rules: [
      {
        id: "curriculum-first",
        description: "Müfredatla ilgili üretimlerde yalnızca LOGOPOS'un kanonik veri setini esas al.",
        effect: "require",
      },
      {
        id: "preserve-formal-meaning",
        description: "Mantıksal sembolleri, doğruluk koşullarını ve niceleyicileri anlamlarını değiştirecek biçimde kullanma.",
        effect: "forbid",
      },
      {
        id: "show-reasoning-steps",
        description: "Mantıksal denetleme ve çözüm görevlerinde kullanılan kural ve ara adımları görünür kıl.",
        effect: "require",
      },
      {
        id: "separate-validity-and-truth",
        description: "Çıkarımın geçerliliği ile önermelerin doğruluğunu birbirinden açıkça ayır.",
        effect: "require",
      },
    ],
  },
  reports: [],
} as const satisfies OpusModule;

export const logoposModule: OpusModule = parseOpusModule(moduleCandidate);
