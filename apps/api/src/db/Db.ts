import { PgClient } from "@effect/sql-pg";
import { Config } from "effect";

// Postgres connection from DATABASE_URL (see .env.example).
export const PgLive = PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") });
