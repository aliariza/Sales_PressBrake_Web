import { pool } from "./postgres.js";
import { ensureQuotesSchema } from "./ensureQuotesSchema.js";

async function backfillQuoteOwners(username) {
  if (!username?.trim()) {
    throw new Error("Kullanici adi gerekli");
  }

  await ensureQuotesSchema();

  const userResult = await pool.query(
    `
    SELECT id, username
    FROM users
    WHERE username = $1
    LIMIT 1
    `,
    [username.trim()]
  );

  if (userResult.rows.length === 0) {
    throw new Error(`Kullanici bulunamadi: ${username}`);
  }

  const user = userResult.rows[0];

  const updateResult = await pool.query(
    `
    UPDATE quotes
    SET
      owner_user_id = $1,
      owner_username = $2,
      updated_at = NOW()
    WHERE owner_user_id IS NULL
    `,
    [user.id, user.username]
  );

  console.log(
    JSON.stringify({
      username: user.username,
      ownerUserId: user.id,
      updatedQuotes: updateResult.rowCount
    })
  );
}

backfillQuoteOwners(process.argv[2])
  .catch((error) => {
    console.error("Error backfilling quote owners:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
