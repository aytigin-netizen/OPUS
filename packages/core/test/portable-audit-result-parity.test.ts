import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validatePortableAuditResult } from "../src/index.js";

type PortableResultParityFixture = {
  readonly id: string;
  readonly payload: unknown;
  readonly expected: {
    readonly status: "valid" | "rejected";
    readonly schemaVersion: "1.0.0" | null;
    readonly computedDigest: string | null;
    readonly errors: readonly string[];
  };
};

const fixtures = JSON.parse(
  readFileSync(new URL("./fixtures/portable-audit-result-parity.json", import.meta.url), "utf8"),
) as {
  readonly fixtureSet: string;
  readonly containsRealStudentData: boolean;
  readonly cases: readonly PortableResultParityFixture[];
};

describe("Pilot 3.1 OPUS/FOPOS taşınabilir sonuç paritesi", () => {
  it("ortak fikstür kümesinin güvenlik ve kapsam beyanını doğrular", () => {
    expect(fixtures.fixtureSet).toBe("opus-fopos-portable-audit-result-parity-3.1");
    expect(fixtures.containsRealStudentData).toBe(false);
    expect(fixtures.cases.map(({ id }) => id)).toEqual([
      "valid-1.0.0",
      "reordered-equivalent",
      "tampered-content",
      "unsupported-schema-version",
      "unsupported-policy-version",
      "invalid-source-and-match-digest",
      "missing-match-field",
      "nested-student-personal-data",
      "nested-file-path",
    ]);
  });

  for (const fixture of fixtures.cases) {
    it(`${fixture.id} için ortak beklenen sonucu üretir`, () => {
      const result = validatePortableAuditResult(fixture.payload);
      expect(result.status).toBe(fixture.expected.status);
      expect(result.schemaVersion).toBe(fixture.expected.schemaVersion);
      expect(result.computedDigest).toBe(fixture.expected.computedDigest);
      expect(result.errors).toEqual(fixture.expected.errors);
    });
  }

  it("alan sırası değişen eşdeğer sonuçta aynı SHA-256 özetini korur", () => {
    const [validCase, reorderedCase] = fixtures.cases;
    expect(validCase?.expected.computedDigest).toMatch(/^[0-9a-f]{64}$/u);
    expect(reorderedCase?.expected.computedDigest).toBe(validCase?.expected.computedDigest);
  });
});
