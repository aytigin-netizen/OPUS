import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { validatePortableAuditVerificationReceipt } from "../src/index.js";

type ReceiptParityCase = {
  readonly id: string;
  readonly payload: unknown;
};

type FlowCase = {
  readonly id: string;
  readonly sourceCaseId?: string;
  readonly inputKind?: "malformed-json" | "oversized-json";
  readonly expectedStatus: "valid" | "rejected";
  readonly expectedErrors: readonly string[];
};

const parity = JSON.parse(
  readFileSync(
    new URL("./fixtures/portable-audit-verification-receipt-parity.json", import.meta.url),
    "utf8",
  ),
) as { readonly cases: readonly ReceiptParityCase[] };

const flow = JSON.parse(
  readFileSync(
    new URL("./fixtures/independent-receipt-verification-flow.json", import.meta.url),
    "utf8",
  ),
) as {
  readonly fixtureSet: string;
  readonly containsRealStudentData: boolean;
  readonly maxFileSizeBytes: number;
  readonly cases: readonly FlowCase[];
};

const parityById = new Map(parity.cases.map((fixture) => [fixture.id, fixture.payload]));

function createInput(fixture: FlowCase): string {
  if (fixture.inputKind === "malformed-json") return "{not-json";
  if (fixture.inputKind === "oversized-json") {
    return JSON.stringify({ padding: "x".repeat(flow.maxFileSizeBytes) });
  }
  const payload = fixture.sourceCaseId ? parityById.get(fixture.sourceCaseId) : undefined;
  if (payload === undefined) throw new Error(`Eksik Pilot 3.2 fikstürü: ${fixture.sourceCaseId}`);
  return JSON.stringify(payload);
}

function validateReceiptJsonDocument(text: string): {
  readonly status: "valid" | "rejected";
  readonly errors: readonly string[];
} {
  if (new TextEncoder().encode(text).byteLength > flow.maxFileSizeBytes) {
    return {
      status: "rejected",
      errors: ["Doğrulama makbuzu dosyası 256 KiB sınırını aşıyor."],
    };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return { status: "rejected", errors: ["Dosya geçerli JSON içermiyor."] };
  }

  const validation = validatePortableAuditVerificationReceipt(payload);
  return { status: validation.status, errors: validation.errors };
}

describe("Pilot 3.3 bağımsız makbuz doğrulama kullanıcı akışı", () => {
  it("ortak fikstür kümesinin kapsam ve mahremiyet sınırlarını sabitler", () => {
    expect(flow.fixtureSet).toBe(
      "opus-fopos-independent-receipt-verification-flow-3.3",
    );
    expect(flow.containsRealStudentData).toBe(false);
    expect(flow.maxFileSizeBytes).toBe(256 * 1024);
    expect(flow.cases.map(({ id }) => id)).toEqual([
      "valid-receipt-file",
      "reordered-equivalent-file",
      "tampered-receipt-file",
      "unsupported-schema-file",
      "unsupported-policy-file",
      "invalid-result-fields-file",
      "student-personal-data-file",
      "source-file-path-file",
      "embedded-source-result-file",
      "malformed-json-file",
      "oversized-json-file",
    ]);
  });

  for (const fixture of flow.cases) {
    it(`${fixture.id} dosyasını ortak kullanıcı akışı kararıyla değerlendirir`, () => {
      const result = validateReceiptJsonDocument(createInput(fixture));
      expect(result.status).toBe(fixture.expectedStatus);
      expect(result.errors).toEqual(fixture.expectedErrors);
    });
  }

  it("yalnız makbuz JSON metnini kullanır; kaynak sonuç veya diğer zincir belgelerini istemez", () => {
    const fixture = flow.cases.find(({ id }) => id === "valid-receipt-file");
    expect(fixture).toBeDefined();
    const result = validateReceiptJsonDocument(createInput(fixture!));
    expect(result).toEqual({ status: "valid", errors: [] });
  });
});
