#!/bin/bash

# MongoDB stores user data outside the repository, so database writes never
# create Git commits or Vercel deployments. Always allow code deployments.
echo "MongoDB persistence is enabled. Proceeding with build."
exit 1
