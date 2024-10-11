#!/bin/bash -e

# ==============================================================================
# This script push file to github.
# ==============================================================================

###########################
# Main script starts here #
###########################

# Get branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD) # E.g. main or 1.0.0

# Check if is main branch
if [ "$BRANCH" == "main" ]; then
  echo "Please change to a version branch."
  exit 1
fi

# Check version
minor_version=$(echo "$BRANCH" | cut -d'.' -f2)
major_version=($(echo "$BRANCH" | cut -d'.' -f1))
patch_version=($(echo "$BRANCH" | cut -d'.' -f3))

VERSION=$major_version.$minor_version.$patch_version
NEW_VERSION=$major_version.$minor_version.$patch_version
if [ "$patch" = "9" ]; then
  major_version=$((major_version+1))
  minor_version=0
  patch_version=0
  NEW_VERSION=$major_version.$minor_version.$patch_version
  else
  patch_version=$((patch_version+1))
  NEW_VERSION=$major_version.$minor_version.$patch_version
fi

echo "Version: $VERSION"
echo "New version: $NEW_VERSION"



