#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
project_id=${1:?Usage: ./deploy-gcp.sh PROJECT_ID [REGION]}
region=${2:-us-central1}
service=doodle-ladder

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project="$project_id"
gcloud run deploy "$service" \
  --project="$project_id" \
  --region="$region" \
  --source=. \
  --allow-unauthenticated \
  --port=8080 \
  --timeout=3600 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=1 \
  --session-affinity \
  --quiet
gcloud run services describe "$service" --project="$project_id" --region="$region" --format='value(status.url)'
