#!/bin/bash

# Script to flatten the nested ignitabull-monorepo directory structure
# This script will move all contents from the inner directory to the outer directory

set -e

echo "🔧 Flattening nested directory structure..."
echo ""

# Define the directories
OUTER_DIR="/Users/ignitabull/Desktop/ignitabull-monorepo"
INNER_DIR="$OUTER_DIR/ignitabull-monorepo"

# Safety checks
if [ ! -d "$OUTER_DIR" ]; then
    echo "❌ Error: Outer directory does not exist: $OUTER_DIR"
    exit 1
fi

if [ ! -d "$INNER_DIR" ]; then
    echo "❌ Error: Inner directory does not exist: $INNER_DIR"
    exit 1
fi

if [ ! -d "$INNER_DIR/.git" ]; then
    echo "❌ Error: No .git directory found in inner directory. Is this the right repository?"
    exit 1
fi

# Current working directory check
CURRENT_DIR=$(pwd)
if [[ "$CURRENT_DIR" == "$INNER_DIR"* ]]; then
    echo "⚠️  Warning: You are currently inside the directory that will be moved."
    echo "   Please cd to a different directory first:"
    echo "   cd $OUTER_DIR"
    exit 1
fi

echo "📁 Current structure:"
echo "   Outer directory: $OUTER_DIR"
echo "   Inner directory: $INNER_DIR"
echo ""

# Backup important files
echo "💾 Creating backup of important files..."
if [ -f "$OUTER_DIR/.env" ]; then
    cp "$OUTER_DIR/.env" "$OUTER_DIR/.env.backup"
    echo "   ✅ Backed up .env file"
fi

# Show what will be moved
echo ""
echo "📋 The following will be moved:"
echo "   - All contents from: $INNER_DIR"
echo "   - To: $OUTER_DIR"
echo "   - Documentation from $OUTER_DIR/docs will be preserved"
echo ""

# Confirm with user
read -p "🔄 Do you want to proceed with flattening the structure? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting migration..."

# Step 1: Move .git directory first
echo "1️⃣ Moving Git repository..."
if [ -d "$OUTER_DIR/.git" ]; then
    echo "   ⚠️  .git directory already exists in outer directory. Backing up..."
    mv "$OUTER_DIR/.git" "$OUTER_DIR/.git.backup.$(date +%s)"
fi
mv "$INNER_DIR/.git" "$OUTER_DIR/.git"
echo "   ✅ Git repository moved"

# Step 2: Move hidden files (except .git)
echo "2️⃣ Moving hidden files..."
cd "$INNER_DIR"
for file in .[^.]*; do
    if [ -e "$file" ] && [ "$file" != ".git" ]; then
        if [ -e "$OUTER_DIR/$file" ]; then
            echo "   ⚠️  $file exists in outer directory, backing up..."
            mv "$OUTER_DIR/$file" "$OUTER_DIR/$file.backup"
        fi
        mv "$file" "$OUTER_DIR/"
        echo "   ✅ Moved $file"
    fi
done

# Step 3: Move regular files and directories
echo "3️⃣ Moving regular files and directories..."
for item in *; do
    if [ -e "$item" ]; then
        if [ -e "$OUTER_DIR/$item" ]; then
            if [ -d "$item" ] && [ -d "$OUTER_DIR/$item" ]; then
                # Both are directories - need to merge
                echo "   🔀 Merging directory: $item"
                if [ "$item" = "docs" ]; then
                    # Special handling for docs directory
                    echo "   📚 Special merge for docs directory..."
                    # Move inner docs to docs/technical
                    mkdir -p "$OUTER_DIR/docs/technical"
                    mv "$item"/* "$OUTER_DIR/docs/technical/" 2>/dev/null || true
                else
                    # For other directories, merge contents
                    cp -r "$item"/* "$OUTER_DIR/$item/" 2>/dev/null || true
                fi
            else
                echo "   ⚠️  $item exists in outer directory, backing up..."
                mv "$OUTER_DIR/$item" "$OUTER_DIR/$item.backup"
                mv "$item" "$OUTER_DIR/"
            fi
        else
            mv "$item" "$OUTER_DIR/"
            echo "   ✅ Moved $item"
        fi
    fi
done

# Step 4: Merge environment variables
echo "4️⃣ Merging environment configurations..."
if [ -f "$OUTER_DIR/.env.backup" ] && [ -f "$OUTER_DIR/.env" ]; then
    echo "   📝 Merging .env files..."
    echo "" >> "$OUTER_DIR/.env"
    echo "# Merged from outer directory .env" >> "$OUTER_DIR/.env"
    cat "$OUTER_DIR/.env.backup" >> "$OUTER_DIR/.env"
    echo "   ✅ Environment files merged"
fi

# Step 5: Remove empty inner directory
echo "5️⃣ Cleaning up..."
cd "$OUTER_DIR"
if [ -d "$INNER_DIR" ]; then
    rmdir "$INNER_DIR" 2>/dev/null || {
        echo "   ⚠️  Could not remove inner directory. It may contain remaining files:"
        ls -la "$INNER_DIR"
    }
fi

# Step 6: Update any absolute paths in configuration files
echo "6️⃣ Updating configuration paths..."
# This would need to be customized based on your specific configuration files
echo "   ℹ️  Please manually check configuration files for any absolute paths"

echo ""
echo "✅ Directory structure flattening complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review the flattened structure"
echo "   2. Check for any .backup files and resolve conflicts"
echo "   3. Update any absolute paths in configuration files"
echo "   4. Test that everything still works correctly"
echo "   5. Remove backup files once confirmed"
echo ""
echo "💡 Recommended commands:"
echo "   cd $OUTER_DIR"
echo "   git status"
echo "   ls -la"
echo ""