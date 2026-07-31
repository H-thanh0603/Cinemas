import assert from "node:assert/strict";
import { isAdminSession } from "../src/lib/admin-auth";

assert.equal(isAdminSession({ id: "u1", role: "ADMIN" }, "ADMIN"), true);
assert.equal(isAdminSession({ id: "u1", role: "ADMIN" }, "CUSTOMER"), false);
assert.equal(isAdminSession({ id: "u1", role: "CUSTOMER" }, "ADMIN"), false);
assert.equal(isAdminSession(null, "ADMIN"), false);

console.log("admin auth checks passed");
