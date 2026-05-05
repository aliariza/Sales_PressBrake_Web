import { pool } from "./postgres.js";
import { ensureQuotesSchema } from "./ensureQuotesSchema.js";

async function patchQuotesTable() {
  await ensureQuotesSchema();
  console.log("quotes table patched successfully");
  await pool.end();
}

patchQuotesTable().catch((error) => {
  console.error("Error patching quotes table:", error);
  process.exit(1);
});
