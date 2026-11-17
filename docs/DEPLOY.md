# Deploy

The API and the web app run on a single VPS managed with [Coolify](https://coolify.io) v4. This page records the settings that live on the server and in Coolify, so the deploy can be rebuilt from scratch. Secrets (database password, webhook secret, Coolify's `APP_KEY`) live in Coolify and in the maintainer's password manager, never here.

## Architecture

```text
Internet ─► provider firewall (22, 80, 443) ─► VPS (Ubuntu 24.04 LTS, 2 vCPU, 4 GB)
                                                │
                                                ├─ sshd :22         keys only
                                                └─ Docker
                                                    ├─ coolify-proxy (Traefik) :80 :443, Let's Encrypt
                                                    │     ├─► web (nginx) :8080   not published
                                                    │     └─► api :3000           not published
                                                    │           └─► postgis :5432 not published
                                                    └─ coolify (panel, served by Traefik over HTTPS)
```

- Traefik terminates TLS and routes by host name (and path) to the container's internal port. No application container publishes a port on the host.
- Domains use [sslip.io](https://sslip.io) until a real domain is bought. HTTP requests are redirected to HTTPS by Coolify's Traefik rules. Coolify warns that Let's Encrypt rate limits are shared by every sslip.io user, so a certificate renewal can fail.

### Same origin for the web app

The web app calls the API at the relative path `/api`, as in development (where Vite proxies `/api` to the API and strips the prefix). In production Traefik does the same, so the browser sees one origin and the API needs no CORS:

```text
https://app.<server-ip>.sslip.io/          ─► web (nginx serves dist/)
https://app.<server-ip>.sslip.io/api/...   ─► api, with /api stripped   (/api/parcels → /parcels)
https://api.<server-ip>.sslip.io/...       ─► api                       (direct access)
```

The `/api` route is a second domain on the **API** resource, with path `/api`. For a domain with a path, Coolify adds a `PathPrefix` rule, which wins over the web app's host-only rule because it is more specific, and a `stripprefix` middleware.

## Coolify resources

One project, environment `production`.

**PostGIS** (Database → PostgreSQL → PostGIS template)

| Setting            | Value                      | Why                                                                                                                       |
| ------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Image              | `postgis/postgis:16-3.6`   | Same as `docker-compose.yml`. The template defaults to Postgres 18.                                                       |
| Persistent storage | `/var/lib/postgresql/data` | PGDATA for Postgres 16. The template's `/var/lib/postgresql` (Postgres 18 layout) leaves the data in an anonymous volume. |
| Publicly available | off                        | The API reaches it over the Docker network.                                                                               |

**API** (Application → Public repository)

| Setting           | Value                                                                                                |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Repository/branch | this repository, `main`                                                                              |
| Build pack        | Dockerfile (not Docker Compose: that file is for local development)                                  |
| Base directory    | `/`                                                                                                  |
| Dockerfile        | `apps/api/Dockerfile`                                                                                |
| Domains           | `https://api.<server-ip>.sslip.io` (no path) and `https://app.<server-ip>.sslip.io` with path `/api` |
| Exposed port      | 3000                                                                                                 |
| Healthcheck       | the Dockerfile's `HEALTHCHECK` (`GET /health`)                                                       |
| Pre-deployment    | empty (see Migrations)                                                                               |

**Web** (Application → Public repository)

| Setting           | Value                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| Repository/branch | this repository, `main`                                                             |
| Build pack        | Dockerfile                                                                          |
| Base directory    | `/`                                                                                 |
| Dockerfile        | `apps/web/Dockerfile` (Node builds `dist/`, the final image is nginx-unprivileged)  |
| Domain            | `https://app.<server-ip>.sslip.io`                                                  |
| Exposed port      | 8080 (Coolify's default is 3000, which would give a healthy container behind a 502) |
| Healthcheck       | the Dockerfile's `HEALTHCHECK` (`GET /`)                                            |
| Environment       | none: the bundle calls `/api` on its own origin                                     |

Every push to `main` redeploys both resources, whatever files changed: this Coolify version (v4.7.5) has no watch paths setting for these resources. A redeploy is a rolling update, so it costs a build, not downtime.

## Environment variables

| Name           | Set in                 | Notes                                                                                                                                             |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | API → Environment vars | The PostGIS resource's **internal** URL. Runtime only: "available during build" would turn it into a build argument visible in the image history. |

Coolify copies variables to preview deployments too. Previews must get their own database before they are enabled (#12).

## Migrations

The image's command is `node src/db/migrate.ts && exec node src/main.ts`:

- migrations run with the new image's code, before the server starts;
- a failed migration exits non-zero, the container never becomes healthy, and the rolling update keeps the previous version;
- `exec` keeps node as PID 1, so it receives SIGTERM.

Coolify's pre-deployment command is not used: it runs in the **currently running (old)** container, so it would apply the old code's migrations. This assumes a single API instance; several replicas would migrate concurrently.

## Deploy flow

1. A pull request runs CI (`check + test`, `pipeline (ruff + pytest)`).
2. Branch protection on `main` requires a pull request and both checks, administrators included.
3. On merge, a GitHub webhook (push events, signed with a shared secret) triggers Coolify. Pushes to other branches are ignored.
4. Coolify builds the image, starts the new container and switches traffic once its healthcheck passes.

Webhook setup: Coolify → resource → Webhooks → GitHub (manual) for the secret and URL; GitHub → Settings → Webhooks with the same URL and secret, content type `application/json`, push event only. The URL is the same for every resource: Coolify matches the repository and branch, then checks the signature against each resource's secret, so the API and the web app share one GitHub webhook and both hold the same secret.

## Server

- **SSH**: key only, no root login (`/etc/ssh/sshd_config.d/00-hardening.conf`). In sshd the first value read wins, hence the `00-` prefix.
- **Root for Coolify**: Coolify manages the host over SSH as root from its Docker network. `/etc/ssh/sshd_config.d/10-coolify-root.conf` allows root with a key only from loopback and private ranges (`Match Address 127.0.0.1,::1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16`).
- **Firewalls**: `ufw` denies incoming traffic except 22, 80 and 443. Docker-published ports bypass `ufw`, so the provider's firewall is the effective one: it allows only 22, 80, 443 and ICMP. Coolify's setup ports (8000, 6001, 6002) are closed now that the panel has a domain. Emergency access to the panel: `ssh -L 8000:localhost:8000 <user>@<server>`, then `http://localhost:8000`.
- **Updates**: `unattended-upgrades` installs security updates daily. `/etc/apt/apt.conf.d/52unattended-upgrades-local` enables an automatic reboot at 04:00 (server time, UTC) when an update requires it. A test reboot confirmed every container restarts on its own (restart policies `always`/`unless-stopped`).

## Data

- **Initial load**: the parcels were copied from a local database with a data-only dump (`pg_dump --data-only --table=parcel -Fc`), then `pg_restore --data-only --single-transaction` inside the PostGIS container. The schema always comes from the migrations.
- **Backups**: not configured yet. Tracked in #33.
