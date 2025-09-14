# GitHub Repository Setup Script for Windows
# This script helps set up the GitHub repository with proper configuration

Write-Host "🚀 Setting up GitHub repository for CRM project..." -ForegroundColor Green

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "📝 Adding files to git..." -ForegroundColor Yellow
git add .

# Create initial commit
Write-Host "💾 Creating initial commit..." -ForegroundColor Yellow
git commit -m "Initial commit: CRM application with CI/CD pipeline"

# Check if remote origin exists
try {
    $originUrl = git remote get-url origin 2>$null
    if ($originUrl) {
        Write-Host "✅ Remote origin already exists: $originUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "🔗 Please add your GitHub repository URL:" -ForegroundColor Yellow
    $repoUrl = Read-Host "Enter GitHub repository URL"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✅ Remote origin added: $repoUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ No repository URL provided. Please add it manually later." -ForegroundColor Red
        Write-Host "   Run: git remote add origin <your-repo-url>" -ForegroundColor Yellow
    }
}

# Push to main branch
Write-Host "📤 Pushing to main branch..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

Write-Host "✅ GitHub repository setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Go to your GitHub repository settings" -ForegroundColor White
Write-Host "2. Add the following secrets in Settings > Secrets and variables > Actions:" -ForegroundColor White
Write-Host "   - DOCKER_USERNAME: Your Docker Hub username" -ForegroundColor White
Write-Host "   - DOCKER_PASSWORD: Your Docker Hub password or access token" -ForegroundColor White
Write-Host "3. Enable GitHub Actions in your repository" -ForegroundColor White
Write-Host "4. Create a develop branch for feature development" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Repository structure:" -ForegroundColor Cyan
Write-Host "   - .github/workflows/: CI/CD pipeline configurations" -ForegroundColor White
Write-Host "   - backend/: Node.js backend with TypeScript" -ForegroundColor White
Write-Host "   - frontend/: Next.js frontend with TypeScript" -ForegroundColor White
Write-Host "   - Docker configurations for containerization" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your CRM project is now ready for collaborative development!" -ForegroundColor Green
