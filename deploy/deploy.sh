#!/bin/bash
set -e

BRANCH="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

source "$SCRIPT_DIR/.env"

if [ -z "$BRANCH" ]; then
  echo "Usage: deploy.sh <branch>"
  exit 1
fi

# Determine environment
if [ "$BRANCH" = "main" ]; then
  TAG="latest"
  BACKEND_ID="$PROD_BACKEND_ID"
  FRONTEND_ID="$PROD_FRONTEND_ID"
  ENV_NAME="production"
elif [ "$BRANCH" = "dev" ]; then
  TAG="dev"
  BACKEND_ID="$DEV_BACKEND_ID"
  FRONTEND_ID="$DEV_FRONTEND_ID"
  ENV_NAME="development"
else
  echo "Unknown branch: $BRANCH, skipping deploy"
  exit 0
fi

echo "=== Deploying $ENV_NAME (branch: $BRANCH, tag: $TAG) ==="

# Pull latest code
cd "$PROJECT_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# Build images
echo "=== Building API image ==="
docker build -f apps/api/Dockerfile -t "localhost:5000/cadry-api:$TAG" .

echo "=== Building Web image ==="
docker build -f apps/web/Dockerfile --build-arg VITE_API_URL="" -t "localhost:5000/cadry-web:$TAG" .

# Push to local registry
echo "=== Pushing images ==="
docker push "localhost:5000/cadry-api:$TAG"
docker push "localhost:5000/cadry-web:$TAG"

# Get Dokploy auth cookie
AUTH_COOKIE=$(curl -s -c - -X POST "$DOKPLOY_URL/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DOKPLOY_EMAIL\",\"password\":\"$DOKPLOY_PASSWORD\"}" \
  | grep session_token | awk '{print $NF}')

if [ -z "$AUTH_COOKIE" ]; then
  echo "ERROR: Failed to authenticate with Dokploy"
  exit 1
fi

# Deploy backend
echo "=== Deploying backend ==="
curl -s -X POST "$DOKPLOY_URL/api/application.deploy" \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=$AUTH_COOKIE" \
  -d "{\"applicationId\":\"$BACKEND_ID\"}"

# Deploy frontend
echo "=== Deploying frontend ==="
curl -s -X POST "$DOKPLOY_URL/api/application.deploy" \
  -H "Content-Type: application/json" \
  -b "better-auth.session_token=$AUTH_COOKIE" \
  -d "{\"applicationId\":\"$FRONTEND_ID\"}"

echo ""
echo "=== $ENV_NAME deploy complete ==="
