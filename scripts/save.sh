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
# Update version in metadata.json
# Reduce version to 2 digits
major_version=$(echo $VERSION | cut -d. -f1)
minor_version=$(echo $VERSION | cut -d. -f2)
rversion="$major_version.$minor_version"
jq ".version = \"$rversion\"" metadata.json > metadata.json.new
mv metadata.json.new metadata.json
sed -i "s/version-name:.*$/version-name: $VERSION/" metadata.json
#jq ".version-name = \"$VERSION\"" metadata.json > metadata.json.new
echo "Updated version in metadata.json"

# Add, commit and push files
cd -- "$( dirname "$0" )/../"
git add .
git commit -m "$VERSION"
git push

echo "Saved version $VERSION and pushed to github."

# Exit script
exit 0
