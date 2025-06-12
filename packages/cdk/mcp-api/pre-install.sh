#!/bin/bash

MCP_JSON_FILE="mcp.json"

echo "Start installing uvx tool..."

UVX_SERVERS=$(jq -r '.mcpServers | to_entries[] | select(.value.command == "uvx") | .key' "$MCP_JSON_FILE")

for SERVER in $UVX_SERVERS; do
    ARGS=$(jq -r ".mcpServers[\"$SERVER\"].args | join(\" \")" "$MCP_JSON_FILE")

    echo "Installing: $SERVER (uv tool install $ARGS)"
    uv tool install $ARGS

    if [ $? -eq 0 ]; then
        echo "✓ $SERVER installed successfully"
    else
        echo "✗ $SERVER failed to install"
    fi
    echo "-----------------------------------"
done

echo "Complete!"
