#!/bin/bash -e

# ==============================================================================
# This script push file to github.
# ==============================================================================

###########################
# Main script starts here #
###########################

# Get version from package.json
VERSION=$(jq -r .version package.json) # E.g. 1.0.0

# Get branch name
BRANCH=$(git rev-parse --abbrev-ref HEAD) # E.g. main or 1.0.0

# Check if version is empty
if [ -z "$VERSION" ]; then
  echo "Please type a version in package.json for the commit."
  exit 1
fi
# Check if is main branch
if [ "$BRANCH" == "main" ]; then
  echo "Please change to a version branch."
  exit 1
fi

# Compare VERSION with branch name.
if [ "$BRANCH" != "$VERSION" ]; then
  # Update version in package.json with branch name
  jq ".version = \"$BRANCH\"" package.json > package.json.new
  mv package.json.new package.json
  echo "Updated version in package.json"
fi

# Update version-name in metadata.json
minor_version=$(echo "$BRANCH" | cut -d'.' -f2)
major_version=($(echo "$BRANCH" | cut -d'.' -f1))
if [ "$minor_version" -eq 9 ]; then
  minor_version=0
  major_version=$((major_version + 1))
else
  minor_version=$((minor_version + 1))
fi

SHORT_VERSION=$major_version.$minor_version

# Update
jq ".version = $SHORT_VERSION" metadata.json > metadata.json.new
mv metadata.json.new metadata.json
echo "Updated version in metadata.json"

# Build
npm run build:install

# Add, commit and push files
cd -- "$( dirname "$0" )/../"
git add .
git commit -S -m "$BRANCH"
git push

echo "All done."

# Exit script
exit 0
