import assert from "node:assert/strict";
import { movieSchema, parseAdminBody } from "../src/lib/admin-schemas";

const valid = parseAdminBody(movieSchema, {
  title: "Test",
  durationMin: "120",
  releaseDate: "2035-01-01",
  posterUrl: "https://placehold.co/400x600",
  role: "ADMIN",
});
assert.equal(valid.ok, true);
if (valid.ok) assert.equal("role" in valid.data, false);

const invalid = parseAdminBody(movieSchema, {
  title: "Test",
  durationMin: 0,
  releaseDate: "not-a-date",
  posterUrl: "https://evil.example/payload.svg",
});
assert.equal(invalid.ok, false);
console.log("admin validation checks passed");
