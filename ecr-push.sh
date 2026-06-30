#!/usr/bin/env bash
# =============================================================================
# ecr-push.sh – Build the minimagic Docker image and push it to Amazon ECR.
#
# Prerequisites
#   - AWS CLI v2   : https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html
#   - Docker       : https://docs.docker.com/get-docker/
#   - IAM permissions: ecr:GetAuthorizationToken, ecr:BatchCheckLayerAvailability,
#                      ecr:InitiateLayerUpload, ecr:UploadLayerPart,
#                      ecr:CompleteLayerUpload, ecr:PutImage
#
# Usage
#   chmod +x ecr-push.sh
#   ./ecr-push.sh
#
# Environment variables (required – export before running or edit the defaults):
#   AWS_REGION                   e.g. us-east-1
#   AWS_ACCOUNT_ID               12-digit AWS account number
#   ECR_REPOSITORY               name of the ECR repository, e.g. minimagic
#   IMAGE_TAG                    Docker image tag, defaults to "latest"
#   NEXT_PUBLIC_SUPABASE_URL     Supabase project URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY  Supabase anon key
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Auto-load .env.local if present (same directory as this script)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.local"

if [[ -f "$ENV_FILE" ]]; then
  echo ">>> Loading environment from .env.local..."
  # Only export variables from .env.local that are NOT already set in the
  # environment. This lets you override any value inline, e.g.:
  #   IMAGE_TAG=v2.0.0 ./ecr-push.sh
  while IFS= read -r line; do
    # skip blank lines and comments
    [[ -z "$line" || "$line" == \#* ]] && continue
    key="${line%%=*}"
    # export only if the caller hasn't already provided this variable
    if [[ -z "${!key+x}" ]]; then
      export "$line"
    fi
  done < <(grep -E '^[^#[:space:]][^=]*=' "$ENV_FILE")
fi

# ---------------------------------------------------------------------------
# Configuration – override with environment variables or edit here
# ---------------------------------------------------------------------------
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"          # REQUIRED
ECR_REPOSITORY="${ECR_REPOSITORY:-minimagic}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}"
NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-}"

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  echo "ERROR: AWS_ACCOUNT_ID is not set." >&2
  echo "       Set it in .env.local or export it: export AWS_ACCOUNT_ID=123456789012" >&2
  exit 1
fi

if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set." >&2
  exit 1
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

echo "=================================================================="
echo " Registry  : ${ECR_REGISTRY}"
echo " Repository: ${ECR_REPOSITORY}"
echo " Tag       : ${IMAGE_TAG}"
echo " Full image: ${FULL_IMAGE}"
echo "=================================================================="

# ---------------------------------------------------------------------------
# Step 1 – Authenticate Docker to ECR
# ---------------------------------------------------------------------------
echo ""
echo ">>> [1/4] Authenticating Docker to Amazon ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ---------------------------------------------------------------------------
# Step 2 – Create the ECR repository if it doesn't exist
# ---------------------------------------------------------------------------
echo ""
echo ">>> [2/4] Ensuring ECR repository '${ECR_REPOSITORY}' exists..."
aws ecr describe-repositories \
    --repository-names "${ECR_REPOSITORY}" \
    --region "${AWS_REGION}" > /dev/null 2>&1 \
  || aws ecr create-repository \
        --repository-name "${ECR_REPOSITORY}" \
        --region "${AWS_REGION}" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256

# ---------------------------------------------------------------------------
# Step 3 – Build the Docker image
# ---------------------------------------------------------------------------
echo ""
echo ">>> [3/4] Building Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
  --build-arg NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}" \
  --tag "${FULL_IMAGE}" \
  --tag "${ECR_REGISTRY}/${ECR_REPOSITORY}:latest" \
  --file Dockerfile \
  .

# ---------------------------------------------------------------------------
# Step 4 – Push to ECR
# ---------------------------------------------------------------------------
echo ""
echo ">>> [4/4] Pushing image to ECR..."
docker push "${FULL_IMAGE}"

# Push the latest tag as well (no-op when IMAGE_TAG is already "latest")
if [[ "${IMAGE_TAG}" != "latest" ]]; then
  docker push "${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"
fi

echo ""
echo "=================================================================="
echo " SUCCESS! Image pushed:"
echo "   ${FULL_IMAGE}"
echo "=================================================================="
