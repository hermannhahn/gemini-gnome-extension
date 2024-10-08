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
minor_version=$(echo "$VERSION" | cut -d'.' -f2)
major_version=($(echo "$VERSION" | cut -d'.' -f1))
if [ "$minor_version" -eq 9 ]; then
  minor_version=0
  major_version=$((major_version + 1))
else
  minor_version=$((minor_version + 1))
fi

VERSION=$major_version;

# Update
jq ".version = \"$VERSION\"" metadata.json > metadata.json.new
mv metadata.json.new metadata.json
echo "Updated version in metadata.json"

# Add, commit and push files
cd -- "$( dirname "$0" )/../"
git add .
git commit -m "$VERSION"
git push

echo "All done."

# Exit script
exit 0
