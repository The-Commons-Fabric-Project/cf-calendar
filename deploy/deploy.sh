#!/usr/bin/env bash
# Builds the production image locally, ships it to the server over SSH, and
# restarts the stack there with docker compose. Configured by deploy/deploy.conf.
#
# Usage: deploy/deploy.sh [--skip-tests]
#   --skip-tests    skip lint and tests
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
config="$script_dir/deploy.conf"
image=commons-fabric

die() { echo "deploy: $*" >&2; exit 1; }
step() { printf '\n==> %s\n' "$*"; }

skip_tests=false
for arg in "$@"; do
  case "$arg" in
    --skip-tests) skip_tests=true ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) die "unknown option: $arg (see --help)" ;;
  esac
done

[[ -f $config ]] || die "missing $config - copy deploy.conf.example to deploy.conf and fill it in"
# shellcheck source=deploy.conf.example
source "$config"
: "${DEPLOY_TARGET:?DEPLOY_TARGET is not set in deploy.conf}"
DEPLOY_SSH_PORT=${DEPLOY_SSH_PORT:-22}
DEPLOY_DIR=${DEPLOY_DIR:-commons-fabric}
DEPLOY_PLATFORM=${DEPLOY_PLATFORM:-linux/amd64}
DEPLOY_KEEP_IMAGES=${DEPLOY_KEEP_IMAGES:-3}

# One shared connection, so a passphrase or password is asked for once.
ssh_opts=(-p "$DEPLOY_SSH_PORT" -o ConnectTimeout=10 -o ControlMaster=auto -o "ControlPath=$HOME/.ssh/cm-%C" -o ControlPersist=120)
remote() { ssh "${ssh_opts[@]}" "$DEPLOY_TARGET" "$@"; }

cd "$repo_root"

# Tagged by commit so an image can be traced and rolled back to; `-dirty` marks
# a build that included uncommitted changes.
tag=$(git rev-parse --short=12 HEAD)
[[ -z $(git status --porcelain) ]] || tag="$tag-dirty"
echo "deploying $image:$tag"

step "Checking server $DEPLOY_TARGET"
remote true || die "cannot connect to $DEPLOY_TARGET on port $DEPLOY_SSH_PORT over SSH"
# `docker info` needs the daemon, so it also catches a user missing from the docker group.
remote 'docker info && docker compose version' >/dev/null 2>&1 || die "docker compose is not usable by this user on the server. On Ubuntu:
  sudo apt install docker.io docker-compose-v2
  sudo usermod -aG docker \$USER    # then log out and back in"
remote "mkdir -p '$DEPLOY_DIR' && test -f '$DEPLOY_DIR/.env'" \
  || die "no $DEPLOY_DIR/.env on the server - copy deploy/server.env.example there and fill it in"

if ! $skip_tests; then
  step "Running lint and tests"
  npm run lint
  npm test
fi

step "Building image for $DEPLOY_PLATFORM"
docker build --platform "$DEPLOY_PLATFORM" --tag "$image:$tag" --tag "$image:latest" .

step "Uploading image"
docker save "$image:$tag" "$image:latest" | gzip | remote 'gunzip | docker load'

step "Starting the stack"
remote "cat > '$DEPLOY_DIR/docker-compose.yml'" < "$script_dir/docker-compose.prod.yml"
if ! remote "cd '$DEPLOY_DIR' && docker compose up -d --remove-orphans --wait --wait-timeout 180"; then
  remote "cd '$DEPLOY_DIR' && docker compose ps && docker compose logs --tail 50 app" || true
  die "the stack did not become healthy - see the logs above"
fi

step "Removing old images (keeping $DEPLOY_KEEP_IMAGES)"
# `docker images` lists newest first; images still in use refuse removal, harmlessly.
remote "docker images $image --format '{{.Tag}}' | grep -vx -e latest -e '$tag' \
  | tail -n +$((DEPLOY_KEEP_IMAGES + 1)) | xargs -r -I{} docker rmi $image:{} >/dev/null 2>&1 || true"

echo
echo "Deployed $image:$tag to $DEPLOY_TARGET."
echo "Roll back with: ssh $DEPLOY_TARGET \"docker tag $image:<old-tag> $image:latest && cd $DEPLOY_DIR && docker compose up -d\""
