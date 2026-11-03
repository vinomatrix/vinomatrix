import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { PgMigrator } from "@effect/sql-pg";
import { Effect, Layer } from "effect";
import createParcel from "../migrations/0001_create_parcel.ts";
import { PgLive } from "./Db.ts";

// Entry point for `pnpm db:migrate`; like main.ts, the only other place that runs effects.
const migrations = {
  "0001_create_parcel": createParcel,
};

const program = PgMigrator.run({ loader: PgMigrator.fromRecord(migrations) }).pipe(
  Effect.tap((applied) =>
    Effect.log(
      applied.length === 0
        ? "Schema up to date"
        : `Applied ${applied.map(([id, name]) => `${String(id)}_${name}`).join(", ")}`,
    ),
  ),
  Effect.provide(Layer.mergeAll(PgLive, NodeServices.layer)),
);

NodeRuntime.runMain(program);
