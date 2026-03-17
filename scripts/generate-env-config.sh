#!/bin/bash

# This script generates env-config.js for runtime environment variables.
# It finds all 'public' directories in the project and creates the config file.

load_env_file() {
    local env_file="$1"

    [ -f "$env_file" ] || return 0

    while IFS= read -r raw_line || [ -n "$raw_line" ]; do
        # Trim leading/trailing whitespace
        line=$(echo "$raw_line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        # Skip blank lines and comments
        [ -z "$line" ] && continue
        case "$line" in
            \#*) continue ;;
        esac

        key=$(echo "$line" | cut -d '=' -f 1 | sed 's/[[:space:]]*$//')
        value=$(echo "$line" | sed 's/^[^=]*=[[:space:]]*//')

        # Strip optional surrounding quotes
        value=$(echo "$value" | sed 's/^"//;s/"$//')

        if [ -n "$key" ]; then
            export "$key=$value"
        fi
    done < "$env_file"
}

# Fallback for environments where vars are present in .env but not exported.
if ! printenv | grep -q '^NEXT_PUBLIC_'; then
    load_env_file "./.env"
fi

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
