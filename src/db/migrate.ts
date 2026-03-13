import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const client = createClient({
  url: process.env.DATABASE_URL ?? "file:sqlite.db",
});

const db = drizzle({ client });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("✅ Migrations applied successfully!");
