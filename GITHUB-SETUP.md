# GitHub Repository Setup Guide

This guide will help you set up your CRM project on GitHub with a complete CI/CD pipeline.

## Prerequisites

- GitHub account
- Git installed on your local machine
- Docker Hub account (for container registry)

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script in your project directory:

**Windows (PowerShell):**
```powershell
.\scripts\setup-github.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/setup-github.sh
./scripts/setup-github.sh
```

### Option 2: Manual Setup

1. **Create a new repository on GitHub:**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name: `crm-application` (or your preferred name)
   - Description: "Full-stack CRM application with Next.js and Node.js"
   - Make it public or private as needed
   - Don't initialize with README (we already have one)

2. **Initialize and push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: CRM application with CI/CD pipeline"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/crm-application.git
   git push -u origin main
   ```

## GitHub Actions Setup

### Required Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add:

1. **DOCKER_USERNAME**: Your Docker Hub username
2. **DOCKER_PASSWORD**: Your Docker Hub password or access token

### Workflow Files

The following workflow files are already configured:

- **`.github/workflows/ci.yml`**: Main CI/CD pipeline
- **`.github/workflows/code-quality.yml`**: Code quality checks
- **`.github/workflows/deploy.yml`**: Production deployment

## Workflow Features

### CI/CD Pipeline (ci.yml)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **Backend Linting**: ESLint and Prettier checks
2. **Frontend Linting**: ESLint and TypeScript checks
3. **Backend Tests**: Jest tests with PostgreSQL and Redis
4. **Frontend Tests**: Jest tests with React Testing Library
5. **Build and Push**: Docker image building and pushing (main branch only)
6. **Security Scan**: Trivy vulnerability scanning

### Code Quality Pipeline (code-quality.yml)

**Additional checks:**
- TypeScript compilation
- Prettier formatting
- TODO/FIXME comment detection
- Console statement detection

## Branch Strategy

### Recommended Workflow

1. **main**: Production-ready code
2. **develop**: Integration branch for features
3. **feature/***: Feature development branches
4. **hotfix/***: Critical bug fixes

### Creating Feature Branches

```bash
# Create and switch to feature branch
git checkout -b feature/new-feature

# Make your changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create pull request to develop branch
```

## Testing Strategy

### Backend Tests
- Unit tests for models and services
- Integration tests for API endpoints
- Database tests with test database

### Frontend Tests
- Component unit tests
- Integration tests for user flows
- API integration tests

### Running Tests Locally

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage
```

## Docker Integration

### Development
```bash
# Start all services
docker-compose -f docker-compose.full.yml up --build
```

### Production
```bash
# Build and push images
docker-compose -f docker-compose.prod.full.yml up --build
```

## Monitoring and Notifications

### GitHub Actions Status
- View workflow runs in the "Actions" tab
- Set up branch protection rules requiring status checks
- Configure notifications for failed builds

### Recommended Branch Protection Rules

1. Go to Settings → Branches
2. Add rule for `main` branch:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Require pull request reviews before merging

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally:**
   - Check environment variables
   - Ensure test database is properly configured
   - Verify all dependencies are installed

2. **Docker build failures:**
   - Check Dockerfile syntax
   - Verify all required files are present
   - Check Docker Hub credentials

3. **Linting failures:**
   - Run `npm run lint:fix` locally
   - Check ESLint configuration
   - Verify Prettier formatting

### Getting Help

- Check the GitHub Actions logs for detailed error messages
- Review the workflow files for configuration issues
- Ensure all required secrets are properly set

## Next Steps

1. **Set up monitoring**: Consider adding application monitoring (e.g., Sentry, DataDog)
2. **Add more tests**: Expand test coverage for critical functionality
3. **Set up staging environment**: Create a staging deployment for testing
4. **Add performance testing**: Include load testing in your CI pipeline
5. **Set up notifications**: Configure Slack/Discord notifications for deployments

## Security Considerations

- Never commit sensitive data (passwords, API keys)
- Use GitHub Secrets for sensitive configuration
- Regularly update dependencies
- Enable Dependabot for automatic dependency updates
- Review security alerts in the GitHub Security tab

## Contributing Guidelines

1. Create feature branches from `develop`
2. Write tests for new functionality
3. Ensure all tests pass before creating PR
4. Follow the existing code style and conventions
5. Update documentation as needed

---

Your CRM project is now ready for collaborative development with a robust CI/CD pipeline! 🎉
