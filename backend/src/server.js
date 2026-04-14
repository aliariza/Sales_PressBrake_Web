import app from "./app.js";
import { connectToDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
  await connectToDatabase();

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
