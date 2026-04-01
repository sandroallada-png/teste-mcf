#!/bin/bash
echo "--- MCF CUSTOM SIGNING FIX (from postinstall) START ---"

# Detect if we are on macOS (Appflow)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Force Team ID
    echo "Setting Team ID to KV825CMDG7..."
    sed -i '' 's/DEVELOPMENT_TEAM = "";/DEVELOPMENT_TEAM = "KV825CMDG7";/g' ios/App/App.xcodeproj/project.pbxproj
    sed -i '' 's/DEVELOPMENT_TEAM = [A-Z0-9]*;/DEVELOPMENT_TEAM = KV825CMDG7;/g' ios/App/App.xcodeproj/project.pbxproj

    # Force Manual Signing
    echo "Setting Manual Sign Style..."
    sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' ios/App/App.xcodeproj/project.pbxproj

    # Disable Signing for all targets including SPM packages
    echo "Disabling signing for dependencies..."
    sed -i '' 's/CODE_SIGNING_ALLOWED = YES/CODE_SIGNING_ALLOWED = NO/g' ios/App/App.xcodeproj/project.pbxproj
    
    echo "--- MCF CUSTOM SIGNING FIX END ---"
else
    echo "Not on macOS, skipping iOS signing fix."
fi
