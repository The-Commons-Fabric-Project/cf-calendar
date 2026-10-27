# Deploying

`deploy.sh` builds the production image on your machine, uploads it to the server
over SSH (no registry), and restarts the stack there with docker compose. Migrations
run automatically when the app container starts.

## One-time setup

**On the server (Ubuntu):**

```sh
sudo apt install docker.io docker-compose-v2
sudo usermod -aG docker $USER      # log out and back in afterwards
mkdir ~/commons-fabric
```

Copy `server.env.example` to `~/commons-fabric/.env` on the server and fill in
`POSTGRES_PASSWORD` and `SESSION_SECRET`.

**On your machine:** you need SSH key access to the server and Docker. Copy
`deploy.conf.example` to `deploy.conf` and set `DEPLOY_TARGET` (e.g.
`deploy@events.example.org` or `deploy@203.0.113.7`) and `DEPLOY_PLATFORM` to
match the server's CPU.

## Deploying

```sh
deploy/deploy.sh
```

It deploys whatever is checked out, including uncommitted changes, after running
lint and tests (`--skip-tests` skips them).

Each deploy is tagged with its commit; the previous few are kept on the server, and
the script prints the command to roll back to one.

## Not handled yet

- **HTTPS.** The app serves plain HTTP on `APP_PORT`. Session cookies are `secure`
  in production, so logging in only works behind a TLS-terminating proxy (e.g.
  Caddy) once the site is reached through a domain.
- **Backups.** Nothing dumps the database; schedule `pg_dump` on the server.
