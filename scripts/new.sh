#!/bin/bash -e

# ==============================================================================
# This script push file to github.
# ==============================================================================

###########################
# Main script starts here #
###########################

# Get command line arguments
UPDATE_TYPE=$1

# Get version from package.json
VERSION=$(jq -r .version package.json) # E.g. 1.0.0


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
if [ "$UPDATE_TYPE" = "upgrade" ]; then
    major_version=$(($major_version + 1))
    minor_version=0
    patch_version=0
else
  if [ "$UPDATE_TYPE" = "update" ]; then
    minor_version=$(($minor_version + 1))
    patch_version=0
  else
    if [ "$UPDATE_TYPE" = "patch" ]; then
      patch_version=$(($patch_version + 1))
    else
      echo "Whrong update type. Try: npm run [upgrade, update or patch]."
      exit 1
    fi
  fi
fi

NEW_VERSION=$major_version.$minor_version.$patch_version

# Update
echo "Version: $VERSION"
echo "New version: $NEW_VERSION"

# Git checkout to new version
git checkout -b $NEW_VERSION

# Update version in package.json
jq ".version = \"$NEW_VERSION\"" package.json > package.json.new
mv package.json.new package.json
echo "Updated version in package.json"

SHORT_VERSION=$major_version.$minor_version

# Update
jq ".version = $SHORT_VERSION" metadata.json > metadata.json.new
mv metadata.json.new metadata.json
echo "Updated version in metadata.json"

# Add, commit and push files
cd -- "$( dirname "$0" )/../"
git add .
git commit -S -m "$NEW_VERSION"
git push --set-upstream origin $NEW_VERSION
git push

# Install extension
npm run build:install
echo "Extension built."
echo "All done."

# Exit script
exit 0


