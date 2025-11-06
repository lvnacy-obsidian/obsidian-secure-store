#!/bin/bash

echo "=================================="
echo "Dev Container Tool Verification"
echo "=================================="
echo ""

# Function to check if a command exists and display its version
check_tool() {
    local tool=$1
    local version_flag=$2
    
    if command -v $tool &> /dev/null; then
        echo "✓ $tool is installed"
        if [ ! -z "$version_flag" ]; then
            echo "  Version: $($tool $version_flag 2>&1 | head -n 1)"
        fi
    else
        echo "✗ $tool is NOT installed"
    fi
    echo ""
}

# Check standard dev tools
echo "Standard Dev Tools:"
echo "-------------------"
check_tool "git" "--version"
check_tool "curl" "--version"
check_tool "bash" "--version"

# Check Volta
echo "Volta:"
echo "------"
check_tool "volta" "--version"
echo "Volta home: $VOLTA_HOME"
echo ""

# Check Node.js
echo "Node.js:"
echo "--------"
check_tool "node" "--version"
check_tool "npm" "--version"

# Check global packages
echo "Global NPM Packages:"
echo "--------------------"
check_tool "tsc" "--version"

# List all global packages
echo "All globally installed packages:"
npm list -g --depth=0 2>/dev/null

# Check project dependencies
echo ""
echo "Project Dependencies:"
echo "---------------------"
npm list --depth=0 2>/dev/null

echo ""
echo "=================================="
echo "Verification Complete!"
echo "=================================="