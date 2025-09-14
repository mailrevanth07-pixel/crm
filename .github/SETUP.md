# GitHub Actions Setup Guide

## Overview
This repository includes GitHub Actions workflows for:
- **CI (Continuous Integration)**: Automated testing, linting, and building
- **CD (Continuous Deployment)**: Automated deployment to Render and Vercel

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)
**Triggers**: Push to `main`/`develop` branches, Pull Requests
**Jobs**:
- Backend CI: Linting, type checking, testing, building
- Frontend CI: Linting, type checking, building
- Security Scan: npm audit for vulnerabilities
- Docker Build: Test Docker image builds

### 2. CD Workflow (`.github/workflows/ci-cd.yml`)
**Triggers**: Push to `main`/`develop` branches
**Jobs**:
- All CI jobs
- Deploy to Staging (develop branch)
- Deploy to Production (main branch)

## Setup Instructions

### 1. Enable GitHub Actions
1. Go to your GitHub repository
2. Click on "Actions" tab
3. Enable GitHub Actions if prompted

### 2. Set up Secrets (for CD workflow)
Go to Settings → Secrets and variables → Actions

#### Required Secrets:
```
RENDER_SERVICE_ID=your-render-service-id
RENDER_API_KEY=your-render-api-key
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

#### How to get these secrets:

**Render Secrets:**
1. Go to Render dashboard
2. Click on your service
3. Go to Settings → General
4. Copy "Service ID"
5. Go to Account Settings → API Keys
6. Create a new API key

**Vercel Secrets:**
1. Go to Vercel dashboard
2. Go to Settings → Tokens
3. Create a new token
4. For org/project IDs, check your project settings

### 3. Test the Workflow
1. Make a small change to your code
2. Push to `develop` branch
3. Check the Actions tab to see the workflow running

## Workflow Features

### ✅ **What's Included:**
- **Automated Testing**: Runs tests on every push/PR
- **Code Quality**: ESLint and TypeScript checking
- **Security Scanning**: npm audit for vulnerabilities
- **Docker Testing**: Ensures Docker images build correctly
- **Database Testing**: PostgreSQL and Redis services
- **Multi-Environment**: Different configs for staging/production

### 🔧 **Customization:**
- Modify `.github/workflows/ci.yml` for CI changes
- Modify `.github/workflows/ci-cd.yml` for deployment changes
- Add more test scripts in package.json
- Configure notification channels (Slack, Discord, etc.)

## Troubleshooting

### Common Issues:
1. **Tests failing**: Check if test scripts exist in package.json
2. **Build failing**: Verify all dependencies are installed
3. **Deployment failing**: Check secrets are set correctly
4. **Database connection**: Ensure test database is properly configured

### Debug Steps:
1. Check the Actions tab for detailed logs
2. Look for specific error messages
3. Verify environment variables are set
4. Test locally with the same commands

## Next Steps

1. **Add Real Tests**: Replace placeholder test scripts with actual tests
2. **Configure Notifications**: Add Slack/Discord notifications
3. **Add More Checks**: Code coverage, performance tests, etc.
4. **Set up Branch Protection**: Require CI to pass before merging

## Benefits

- **Automated Quality Assurance**: Catches issues before deployment
- **Consistent Deployments**: Same process every time
- **Team Collaboration**: Everyone follows the same standards
- **Professional Setup**: Shows attention to best practices
