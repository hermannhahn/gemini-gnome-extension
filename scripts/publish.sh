#!/bin/bash -e

# ==============================================================================
# This script push file to github.
# ==============================================================================

###########################
# Main script starts here #
###########################

# Get command line arguments
UPDATE_TYPE=$1

# Get branch name
VERSION=$(git rev-parse --abbrev-ref HEAD) # E.g. main or 1.0.0

# Check if is main branch
if [ "$VERSION" == "main" ]; then
  echo "Please change to a version branch."
  exit 1
fi

# Change to main branch
git checkout main
cd -- "$( dirname "$0" )/../"

# Update main with version branch
git merge $VERSION

# Push to github
git push

# Change to version branch
git checkout $VERSION

git add .
git commit -S -m "$VERSION"
git push


# Build
npm run build:install
echo "Extension built."
echo "All done."

# Exit script
exit 0


