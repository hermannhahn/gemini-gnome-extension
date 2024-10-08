#!/bin/bash -e

# ==============================================================================
# This script push file to github.
# ==============================================================================

###########################
# Main script starts here #
###########################


# Get version from package.json
VERSION=$(jq -r '.version' package.json)

echo "Current Version: $VERSION"

# Check if comment is empty
if [ -z "$VERSION" ]; then
  echo "Please type a version in package.json for the commit."
  exit 1
fi

# Update version-name in metadata.json
echo "Updating version in metadata.json..."
sed -i "s/\"version-\name\": [0-9]\+/\"version-\name\": $VERSION/" metadata.json
# Reduce version to 2 digits
VERSION=$(echo $VERSION | cut -d'.' -f1-2)
# Update version in metadata.json
echo "Updating version in metadata.json..."
sed -i "s/\"version\": [0-9]\+\[0-9]\+/\"version\": $VERSION/" metadata.json


# Add, commit and push files
cd -- "$( dirname "$0" )/../"
git add .
git commit -m "$VERSION"
git push

echo "Saved version $VERSION and pushed to github."

# Exit script
exit 0
