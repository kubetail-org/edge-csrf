#!/bin/bash

# Check if a version number was provided as an argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <new-version>"
    exit 1
fi

# Assign the new version number from command line arguments
NEW_VERSION=$1

# Function to update the version in a package.json file
update_version() {
    local file=$1
    echo "Updating version in $file to $NEW_VERSION"
    # Portable handling of in-place editing with sed
    sed -i.bak -E "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$file" && rm "$file.bak"
}

export -f update_version
export NEW_VERSION

# Find all package.json files in the packages directory, excluding node_modules directories
find ./packages -name "package.json" -not -path "*/node_modules/*" -exec bash -c 'update_version "$0"' {} \;

echo "Version update completed."
