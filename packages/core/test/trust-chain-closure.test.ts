import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

type Stage = {
  readonly pilot: string;
  readonly step: string;
  readonly fixtureSet: string;
  readonly fixtureFile: string;
  readonly supportedSchemaVersions: readonly string[];
  readonly policyVersions: readonly string[];
  readonly maxFileSizeBytes?: number;
  readonly requiresNoStudentPersonalData: boolean;
};

const matrix = JSON.parse(
  readFileSync(
    new URL("./fixtures/trust-chain-closure-matrix.json", import.meta.url),
    "utf8",
  ),
) as {
  readonly schemaVersion: string;
  readonly matrixId: string;
  readonly containsRealStudentData: boolean;
  readonly producesDerivedEvidence: boolean;
  readonly stages: readonly Stage[];
  readonly forbiddenKeyFragments: readonly string[];
  readonly chainOrder: readonly string[];
};

function readFixture(stage: Stage): {
  readonly fixtureSet: string;
  readonly containsRealStudentData: boolean;
  readonly maxFileSizeBytes?: number;
} {
  return JSON.parse(
    readFileSync(new URL(`./fixtures/${stage.fixtureFile}`, import.meta.url), "utf8"),
  ) as {
    readonly fixtureSet: string;
    readonly containsRealStudentData: boolean;
    readonly maxFileSizeBytes?: number;
  };
}

describe("Pilot 3.4 güven zinciri kapanış matrisi", () => {
  it("Pilot 3.0–3.3 adımlarını tek ve sabit sırada kapsar", () => {
    expect(matrix.schemaVersion).toBe("1.0.0");
    expect(matrix.matrixId).toBe("opus-fopos-trust-chain-closure-3.4");
    expect(matrix.stages.map(({ pilot }) => pilot)).toEqual(["3.0", "3.1", "3.2", "3.3"]);
    expect(matrix.stages.map(({ step }) => step)).toEqual(matrix.chainOrder);
  });

  it("her adımı mevcut ortak fikstür kümesine bağlar", () => {
    for (const stage of matrix.stages) {
      const fixture = readFixture(stage);
      expect(fixture.fixtureSet).toBe(stage.fixtureSet);
      expect(fixture.containsRealStudentData).toBe(false);
      expect(stage.requiresNoStudentPersonalData).toBe(true);
    }
  });

  it("desteklenen şema ve politika sürümlerini kapanış kapısında sabitler", () => {
    expect(matrix.stages.map(({ supportedSchemaVersions }) => supportedSchemaVersions)).toEqual([
      ["1.2.0"],
      ["1.0.0"],
      ["1.0.0"],
      ["1.0.0"],
    ]);
    expect(matrix.stages.map(({ policyVersions }) => policyVersions)).toEqual([
      [],
      ["1.0.0"],
      ["1.0.0"],
      ["1.0.0"],
    ]);
  });

  it("bağımsız makbuz doğrulamasının 256 KiB sınırını çapraz doğrular", () => {
    const stage = matrix.stages.find(({ pilot }) => pilot === "3.3");
    expect(stage).toBeDefined();
    expect(stage?.maxFileSizeBytes).toBe(256 * 1024);
    expect(readFixture(stage!).maxFileSizeBytes).toBe(stage?.maxFileSizeBytes);
  });

  it("yeni türev kanıt ve gerçek öğrenci verisi üretmez", () => {
    expect(matrix.producesDerivedEvidence).toBe(false);
    expect(matrix.containsRealStudentData).toBe(false);
    expect(matrix.forbiddenKeyFragments).toEqual([
      "studentName",
      "studentNumber",
      "fileName",
      "filePath",
      "sourceResult",
    ]);
  });
});
