import assert from "node:assert/strict";
import { test } from "node:test";
import { authErrorMessage, authNotice, getSupabaseConfig, safeRedirect } from "./auth.ts";
import { farmerDetails, readTasks, taskLimit } from "./farm.ts";

test("redirects allow only exact local destinations", () => {
  assert.equal(safeRedirect("/dashboard"), "/dashboard");
  assert.equal(safeRedirect("/update-password"), "/update-password");
  for (const destination of [null, undefined, "https://evil.test", "//evil.test", "/\\evil.test", "/dashboard/../auth/callback", "/update-password?next=https://evil.test", "%2f%2fevil.test", ["/update-password"]]) {
    assert.equal(safeRedirect(destination), "/dashboard");
  }
});

test("untrusted errors and query strings are never reflected", () => {
  const secret = "private-token-value";
  assert.ok(!authErrorMessage(new Error(secret)).includes(secret));
  assert.equal(authNotice(secret), "");
  assert.match(authErrorMessage({ code: "invalid_credentials" }), /incorrect/);
});

test("missing configuration and privileged keys are rejected", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.equal(getSupabaseConfig(), null);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_example";
    assert.equal(getSupabaseConfig(), null);

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = `header.${btoa(JSON.stringify({ role: "service_role" }))}.signature`;
    assert.equal(getSupabaseConfig(), null);

    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_example";
    assert.ok(getSupabaseConfig());

    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature";
    assert.ok(getSupabaseConfig());

    process.env.NEXT_PUBLIC_SUPABASE_URL = "javascript:alert(1)";
    assert.equal(getSupabaseConfig(), null);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
    if (originalAnonKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  }
});

test("farmer details preserve metadata names and allow empty optional fields", () => {
  const form = new FormData();
  form.set("full_name", "  Test Farmer  ");
  form.set("land_unit", "ropani");
  assert.deepEqual(farmerDetails(form), { full_name: "Test Farmer", phone: "", farm_name: "", farm_location: "", farm_size: null, land_unit: "ropani" });
  form.set("farm_size", "2.5");
  assert.equal(farmerDetails(form).farm_size, 2.5);
  for (const invalidSize of ["-1", "NaN", "Infinity"]) {
    form.set("farm_size", invalidSize);
    assert.throws(() => farmerDetails(form), /farm size/);
  }
  form.set("farm_size", "0");
  form.set("land_unit", "unknown");
  assert.throws(() => farmerDetails(form), /land unit/);
});

test("notebook metadata is bounded and rejects malformed or duplicate tasks", () => {
  assert.deepEqual(readTasks(null), []);
  const valid = { id: "first", title: "Water seedlings", done: false };
  assert.deepEqual(readTasks([valid, valid, null, { id: "bad", title: "", done: false }, { ...valid, id: "other", done: "false" }]), [valid]);
  assert.equal(readTasks(Array.from({ length: 30 }, (_, index) => ({ ...valid, id: String(index) }))).length, taskLimit);
  assert.deepEqual(readTasks([{ ...valid, title: "x".repeat(121) }]), []);
});