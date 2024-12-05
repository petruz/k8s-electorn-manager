#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Source NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status messages
print_status() {
    echo -e "${2}$1${NC}"
}

# Check if Node.js is installed
if ! command_exists node; then
    print_status "Node.js is not installed. Please install Node.js first." "$RED"
    print_status "Visit https://nodejs.org/ for installation instructions." "$YELLOW"
    exit 1
fi

# Check if npm is installed
if ! command_exists npm; then
    print_status "npm is not installed. Please install npm first." "$RED"
    exit 1
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the application directory
cd "$SCRIPT_DIR" || exit

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_status "package.json not found. Please ensure you're in the correct directory." "$RED"
    exit 1
fi

# Check if required dependencies are in package.json
if ! grep -q '"electron-store"' package.json; then
    print_status "Adding required dependency: electron-store..." "$YELLOW"
    npm install --save electron-store@6.0.1
    if [ $? -ne 0 ]; then
        print_status "Failed to install electron-store." "$RED"
        exit 1
    fi
    print_status "electron-store installed successfully." "$GREEN"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..." "$YELLOW"
    npm install
    if [ $? -ne 0 ]; then
        print_status "Failed to install dependencies." "$RED"
        exit 1
    fi
    print_status "Dependencies installed successfully." "$GREEN"
fi

# Check if kubectl is installed (optional but recommended)
if ! command_exists kubectl; then
    print_status "Warning: kubectl is not installed. Some features might not work correctly." "$YELLOW"
    print_status "Visit https://kubernetes.io/docs/tasks/tools/ for installation instructions." "$YELLOW"
fi

# Check if electron-store is properly installed
if [ ! -d "node_modules/electron-store" ]; then
    print_status "electron-store not found. Installing..." "$YELLOW"
    npm install --save electron-store@6.0.1
    if [ $? -ne 0 ]; then
        print_status "Failed to install electron-store." "$RED"
        exit 1
    fi
    print_status "electron-store installed successfully." "$GREEN"
fi

# Start the application
print_status "Starting Kubernetes Manager..." "$GREEN"
npx electron .
