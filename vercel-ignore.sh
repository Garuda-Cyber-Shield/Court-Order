#!/bin/bash

# Vercel Ignored Build Step Script
# Purpose: Skip frontend builds if the ONLY thing modified was 'server/data/users.txt'

echo "Checking if we should build..."

# If VERCEL_GIT_PREVIOUS_SHA is not set (e.g., initial clone/commit), always build.
if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ]; then
  echo "No previous SHA found. Proceeding with build."
  exit 1
fi

# Compare the previous commit with the current commit context.
# We exclude server/data/users.txt. If there are other changes, git diff --quiet returns 1 (proceed with build).
# If there are NO other changes, git diff --quiet returns 0 (cancel build).
git diff --quiet $VERCEL_GIT_PREVIOUS_SHA $VERCEL_GIT_COMMIT_SHA . ':!server/data/users.txt'

# Capture the exit code of git diff
DIFF_CODE=$?

if [ $DIFF_CODE -eq 0 ]; then
  echo "Only server/data/users.txt was changed. Skipping build!"
  exit 0
elif [ $DIFF_CODE -eq 128 ]; then
  echo "Git diff threw a fatal error (e.g. shadow clone limit reached). Force building to be safe."
  exit 1
else
  echo "Other core files were changed. Proceeding with frontend build."
  exit 1
fi
