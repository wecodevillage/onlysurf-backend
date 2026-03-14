#!/bin/bash
set -e
set -x

if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Exiting."
    exit 1
fi

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if ! nvm use >/dev/null 2>&1; then
    echo "Error: Failed to switch Node version using nvm. Make sure the correct Node version is installed. Exiting."
    exit 1
fi

for dir in backend trigger.dev; do
    if [ -d "$dir" ]; then
        echo "Running npm install in $dir..."
        (cd "$dir" && npm install --legacy-peer-deps)
    else
        echo "Error: Folder '$dir' does not exist. Exiting."
        exit 1
    fi
done

echo "✅ Dependencies installed successfully!"
echo ""
echo "📊 Database: Using Neon serverless PostgreSQL"
echo "   No local database container needed!"
echo "   See NEON-BRANCHES.md for branch management"
echo ""
echo "Starting docker compose file..."
docker-compose -f docker-compose.yaml up -d --build

