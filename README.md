# Vinomatrix

Pick a Neuchâtel vineyard parcel on a map and a grape; get the wine's likely profile, its drinking window, and _why_ — decoded from open geodata (SITN, swisstopo, MeteoSwiss) by a transparent, tested rules engine.

Work in progress. See [docs/PITCH.md](docs/PITCH.md) for scope and milestones.

## Local database

PostGIS 16 runs in Docker for local development. You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

```sh
pnpm db:up     # start PostGIS on localhost:5432 and wait until it is healthy
pnpm db:down   # stop it (data stays in the `pgdata` volume)
pnpm db:migrate  # create or update the schema (apps/api/src/migrations)
```

Connection string: `postgres://vinomatrix:vinomatrix@localhost:5432/vinomatrix` (see `.env.example`).
If port 5432 is already taken, set `DB_PORT` (for example `DB_PORT=5433 pnpm db:up`) and change the port in `DATABASE_URL` to match.

To wipe the data and start fresh: `docker compose down -v`.

## Load the data

The pipeline needs geodienste.ch credentials for the NE vineyard cadastre in `.env` (see [docs/DATA.md](docs/DATA.md)).

```sh
pnpm db:up && pnpm db:migrate
uv run --project tools/pipeline pipeline sync            # download (cached) and load parcels
uv run --project tools/pipeline pipeline sync --refresh  # download again
```
