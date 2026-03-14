#!/bin/bash

# Neon Branch Management Script
# This script helps manage Neon database branches for local development

set -e

NEON_PROJECT_ID="${NEON_PROJECT_ID}"
NEON_API_KEY="${NEON_API_KEY}"

if [ -z "$NEON_PROJECT_ID" ] || [ -z "$NEON_API_KEY" ]; then
    echo "❌ Error: NEON_PROJECT_ID and NEON_API_KEY must be set in .env"
    echo "Get your API key from: https://console.neon.tech/app/settings/api-keys"
    exit 1
fi

# Function to list branches
list_branches() {
    echo "📋 Listing Neon branches..."
    curl -s -X GET \
        "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
        -H "Authorization: Bearer ${NEON_API_KEY}" \
        -H "Accept: application/json" | jq -r '.branches[] | "\(.id) - \(.name) (\(.current_state))"'
}

# Function to create a new branch
create_branch() {
    local BRANCH_NAME=$1
    local PARENT_BRANCH=${2:-main}
    
    if [ -z "$BRANCH_NAME" ]; then
        echo "❌ Error: Please provide a branch name"
        echo "Usage: $0 create <branch-name> [parent-branch]"
        exit 1
    fi
    
    echo "🌱 Creating branch: $BRANCH_NAME from $PARENT_BRANCH..."
    
    RESPONSE=$(curl -s -X POST \
        "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
        -H "Authorization: Bearer ${NEON_API_KEY}" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d "{
            \"branch\": {
                \"name\": \"${BRANCH_NAME}\",
                \"parent_id\": \"${PARENT_BRANCH}\"
            }
        }")
    
    echo "$RESPONSE" | jq '.'
    
    # Extract connection string
    CONNECTION_STRING=$(echo "$RESPONSE" | jq -r '.connection_uris[0].connection_uri')
    
    if [ "$CONNECTION_STRING" != "null" ]; then
        echo ""
        echo "✅ Branch created successfully!"
        echo "📝 Add this to your .env file:"
        echo "DATABASE_URL=\"${CONNECTION_STRING}\""
    fi
}

# Function to get branch connection string
get_connection() {
    local BRANCH_NAME=$1
    
    if [ -z "$BRANCH_NAME" ]; then
        echo "❌ Error: Please provide a branch name"
        echo "Usage: $0 connect <branch-name>"
        exit 1
    fi
    
    echo "🔗 Getting connection string for branch: $BRANCH_NAME..."
    
    RESPONSE=$(curl -s -X GET \
        "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches" \
        -H "Authorization: Bearer ${NEON_API_KEY}" \
        -H "Accept: application/json")
    
    CONNECTION_STRING=$(echo "$RESPONSE" | jq -r ".branches[] | select(.name == \"${BRANCH_NAME}\") | .connection_uris[0].connection_uri")
    
    if [ "$CONNECTION_STRING" != "null" ] && [ -n "$CONNECTION_STRING" ]; then
        echo ""
        echo "✅ Connection string found!"
        echo "📝 Add this to your .env file:"
        echo "DATABASE_URL=\"${CONNECTION_STRING}\""
    else
        echo "❌ Branch not found: $BRANCH_NAME"
        exit 1
    fi
}

# Function to delete a branch
delete_branch() {
    local BRANCH_ID=$1
    
    if [ -z "$BRANCH_ID" ]; then
        echo "❌ Error: Please provide a branch ID"
        echo "Usage: $0 delete <branch-id>"
        exit 1
    fi
    
    echo "🗑️  Deleting branch: $BRANCH_ID..."
    
    curl -s -X DELETE \
        "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/branches/${BRANCH_ID}" \
        -H "Authorization: Bearer ${NEON_API_KEY}" \
        -H "Accept: application/json"
    
    echo "✅ Branch deleted successfully!"
}

# Main script
case "$1" in
    list)
        list_branches
        ;;
    create)
        create_branch "$2" "$3"
        ;;
    connect)
        get_connection "$2"
        ;;
    delete)
        delete_branch "$2"
        ;;
    *)
        echo "🚀 Neon Branch Management"
        echo ""
        echo "Usage: $0 {list|create|connect|delete} [options]"
        echo ""
        echo "Commands:"
        echo "  list                              List all branches"
        echo "  create <name> [parent]            Create a new branch"
        echo "  connect <name>                    Get connection string for a branch"
        echo "  delete <branch-id>                Delete a branch"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 create dev-user1 main"
        echo "  $0 connect dev-user1"
        echo "  $0 delete br-abc123"
        echo ""
        echo "Required environment variables:"
        echo "  NEON_PROJECT_ID    Your Neon project ID"
        echo "  NEON_API_KEY       Your Neon API key"
        exit 1
        ;;
esac
