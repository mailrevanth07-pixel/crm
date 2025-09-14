#!/bin/bash

# GitHub Repository Setup Script
# This script helps set up the GitHub repository with proper configuration

echo "🚀 Setting up GitHub repository for CRM project..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: CRM application with CI/CD pipeline"

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Please add your GitHub repository URL:"
    read -p "Enter GitHub repository URL: " REPO_URL
    
    if [ -n "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote origin added: $REPO_URL"
    else
        echo "❌ No repository URL provided. Please add it manually later."
        echo "   Run: git remote add origin <your-repo-url>"
    fi
fi

# Push to main branch
echo "📤 Pushing to main branch..."
git branch -M main
git push -u origin main

echo "✅ GitHub repository setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your GitHub repository settings"
echo "2. Add the following secrets in Settings > Secrets and variables > Actions:"
echo "   - DOCKER_USERNAME: Your Docker Hub username"
echo "   - DOCKER_PASSWORD: Your Docker Hub password or access token"
echo "3. Enable GitHub Actions in your repository"
echo "4. Create a develop branch for feature development"
echo ""
echo "🔧 Repository structure:"
echo "   - .github/workflows/: CI/CD pipeline configurations"
echo "   - backend/: Node.js backend with TypeScript"
echo "   - frontend/: Next.js frontend with TypeScript"
echo "   - Docker configurations for containerization"
echo ""
echo "🎉 Your CRM project is now ready for collaborative development!"
