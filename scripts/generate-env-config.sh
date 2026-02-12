#!/bin/bash

# This script generates env-config.js for runtime environment variables.
# It finds all 'public' directories in the project and creates the config file.

generate_config() {
    local output_file="$1"
    echo "window.__ENV = {" > "$output_file"
    
    # Get all environment variables starting with NEXT_PUBLIC_
    # Format them as "KEY": "VALUE",
    printenv | grep NEXT_PUBLIC_ | while read -r line; do
        key=$(echo "$line" | cut -d '=' -f 1)
        value=$(echo "$line" | cut -d '=' -f 2-)
        # Escape double quotes in value
        value=$(echo "$value" | sed 's/"/\\"/g')
        echo "  \"$key\": \"$value\"," >> "$output_file"
    done
    
    echo "};" >> "$output_file"
    echo "Configuration generated in $output_file"
}

# Generate for main app
generate_config "./apps/shikshagraha-app/public/env-config.js"

# Generate for MFEs if they exist
for mfe in ./mfes/*; do
    if [ -d "$mfe/public" ]; then
        generate_config "$mfe/public/env-config.js"
    fi
done
