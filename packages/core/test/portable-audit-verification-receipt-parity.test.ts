import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validatePortableAuditVerificationReceipt } from "../src/index.js";

type ReceiptParityFixture = {
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
  readFileSync(
    new URL("./fixtures/portable-audit-verification-receipt-parity.json", import.meta.url),
    "utf8",
  ),
) as {
  readonly fixtureSet: string;
  readonly containsRealStudentData: boolean;
  readonly cases: readonly ReceiptParityFixture[];
};

describe("Pilot 3.2 OPUS/FOPOS doğrulama makbuzu paritesi", () => {
  it("ortak fikstür kümesinin güvenlik ve kapsam beyanını doğrular", () => {
    expect(fixtures.fixtureSet).toBe(
      "opus-fopos-portable-audit-verification-receipt-parity-3.2",
    );
    expect(fixtures.containsRealStudentData).toBe(false);
    expect(fixtures.cases.map(({ id }) => id)).toEqual([
      "valid-1.0.0",
      "reordered-equivalent",
      "tampered-content",
      "unsupported-schema-version",
      "unsupported-policy-version",
      "invalid-result-fields",
      "student-personal-data",
      "source-file-path",
      "embedded-source-result",
    ]);
  });

  for (const fixture of fixtures.cases) {
    it(`${fixture.id} için ortak beklenen sonucu üretir`, () => {
      const result = validatePortableAuditVerificationReceipt(fixture.payload);
      expect(result.status).toBe(fixture.expected.status);
      expect(result.schemaVersion).toBe(fixture.expected.schemaVersion);
      expect(result.computedDigest).toBe(fixture.expected.computedDigest);
      expect(result.errors).toEqual(fixture.expected.errors);
    });
  }

  it("alan sırası değişen eşdeğer makbuzda aynı SHA-256 özetini korur", () => {
    const [validCase, reorderedCase] = fixtures.cases;
    expect(validCase?.expected.computedDigest).toMatch(/^[0-9a-f]{64}$/u);
    expect(reorderedCase?.expected.computedDigest).toBe(validCase?.expected.computedDigest);
  });
});
