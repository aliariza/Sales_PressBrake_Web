import { pool } from "../db/postgres.js";

function mapUserRow(row) {
  return {
    id: row.id,
    legacyNo: row.legacy_no == null ? "" : String(row.legacy_no),
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    comments: row.comments || "",
    rawData: row.raw_data ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function toPublicUser(user) {
  return {
    id: user.id,
    legacyNo: user.legacyNo || "",
    username: user.username,
    role: user.role,
    comments: user.comments || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export async function getAllUsers() {
  const result = await pool.query(`
    SELECT
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at ASC
  `);

  return result.rows.map(mapUserRow);
}

export async function getUserById(id) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
}

export async function getUserByUsername(username) {
  const result = await pool.query(
    `
    SELECT
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    FROM users
    WHERE username = $1
    `,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
}

export async function countAdmins() {
  const result = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM users
    WHERE role = 'admin'
  `);

  return result.rows[0].count;
}

export async function createUser(userData) {
  const { legacyNo, username, passwordHash, role, comments } = userData;

  const result = await pool.query(
    `
    INSERT INTO users (
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data
    )
    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    RETURNING
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      username,
      passwordHash,
      role,
      comments || "",
      JSON.stringify({
        legacyNo,
        username,
        role,
        comments
      })
    ]
  );

  return mapUserRow(result.rows[0]);
}

export async function updateUser(id, userData) {
  const { legacyNo, username, passwordHash, role, comments } = userData;

  const result = await pool.query(
    `
    UPDATE users
    SET
      legacy_no = $1,
      username = $2,
      password_hash = COALESCE($3, password_hash),
      role = $4,
      comments = $5,
      raw_data = $6::jsonb,
      updated_at = NOW()
    WHERE id = $7
    RETURNING
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    `,
    [
      legacyNo || null,
      username,
      passwordHash || null,
      role,
      comments || "",
      JSON.stringify({
        legacyNo,
        username,
        role,
        comments
      }),
      id
    ]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
}

export async function deleteUser(id) {
  const result = await pool.query(
    `
    DELETE FROM users
    WHERE id = $1
    RETURNING
      id,
      legacy_no,
      username,
      password_hash,
      role,
      comments,
      raw_data,
      created_at,
      updated_at
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUserRow(result.rows[0]);
}