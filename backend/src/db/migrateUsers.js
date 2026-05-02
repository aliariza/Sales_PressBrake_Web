import mongoose from "mongoose";

import { connectToDatabase } from "../config/db.js";
import { User } from "../models/User.js";
import {
  createUser,
  getUserByUsername
} from "../repositories/userRepository.js";
import { pool } from "./postgres.js";

async function migrateUsers() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();

  console.log("Mongo readyState:", mongoose.connection.readyState);

  const users = await User.find({}).lean();

  for (const user of users) {
    const existing = await getUserByUsername(user.username);

    if (existing) {
      console.log(`Skipped existing user: ${user.username}`);
      continue;
    }

    await createUser({
      legacyNo: user.legacyNo || "",
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      comments: user.comments || ""
    });

    console.log(`Migrated user: ${user.username}`);
  }

  console.log("Users migrated successfully.");

  await mongoose.disconnect();
  await pool.end();
}

migrateUsers().catch(async (error) => {
  console.error("Migration failed:", error);

  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }

  try {
    await pool.end();
  } catch {
    // ignore
  }

  process.exit(1);
});