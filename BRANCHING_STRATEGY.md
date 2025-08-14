# 🌿 Branching Strategy - MTG Investment Project

## 📋 Overview

This document outlines the Git branching strategy for the MTG Investment tracking application. We follow a **GitFlow methodology** adapted for our development workflow.

## 🏗️ Branch Structure

### **Main Branches**

#### **`main`** 
- **Purpose**: Production-ready code
- **Protection**: Fully protected, requires PR reviews
- **Merges from**: `release/*` and `hotfix/*` branches only
- **Deploys to**: Production environment
- **Naming**: Always `main`

#### **`develop`**
- **Purpose**: Integration branch for feature development
- **Protection**: Protected, requires PR reviews  
- **Merges from**: `feature/*` branches
- **Merges to**: `release/*` branches
- **Naming**: Always `develop`

### **Supporting Branches**

#### **Feature Branches (`feature/*`)**
- **Purpose**: Development of new features or enhancements
- **Branches from**: `develop`
- **Merges to**: `develop`
- **Naming Convention**: `feature/<issue-number>-<short-description>`
- **Examples**: 
  - `feature/123-card-price-tracking`
  - `feature/456-user-authentication`
  - `feature/789-portfolio-dashboard`

#### **Release Branches (`release/*`)**
- **Purpose**: Prepare releases, bug fixes, and final testing
- **Branches from**: `develop`
- **Merges to**: `main` and `develop`
- **Naming Convention**: `release/<version>`
- **Examples**:
  - `release/1.0.0`
  - `release/1.1.0`
  - `release/2.0.0-beta`

#### **Hotfix Branches (`hotfix/*`)**
- **Purpose**: Critical production bug fixes
- **Branches from**: `main`
- **Merges to**: `main` and `develop`
- **Naming Convention**: `hotfix/<issue-number>-<short-description>`
- **Examples**:
  - `hotfix/urgent-security-patch`
  - `hotfix/critical-data-bug`

## 🔄 Workflow Process

### **Feature Development**
1. Create feature branch from `develop`
2. Develop and commit changes
3. Push feature branch and create PR to `develop`
4. Code review and testing
5. Merge to `develop` after approval

### **Release Process**
1. Create release branch from `develop`
2. Final testing and bug fixes
3. Update version numbers and changelog
4. Create PR to `main`
5. After merge, tag release on `main`
6. Merge back to `develop`

### **Hotfix Process**
1. Create hotfix branch from `main`
2. Fix critical issue
3. Create PRs to both `main` and `develop`
4. Deploy immediately after merge to `main`

## 🛡️ Branch Protection Rules

### **`main` Branch**
- ✅ Require pull request reviews (2 reviewers)
- ✅ Require status checks to pass
- ✅ Require up-to-date branches
- ✅ Include administrators
- ✅ Restrict pushes to admins only

### **`develop` Branch**
- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Require up-to-date branches
- ✅ Allow force pushes for maintainers

## 🤖 CI/CD Integration

Our GitHub Actions workflow supports this branching strategy:

```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main, develop ]
```

### **Automated Checks**
- **All branches**: Linting, type checking, unit tests
- **PRs to `main`**: Full test suite, security scan, build verification
- **PRs to `develop`**: Integration tests, performance checks

## 📦 Deployment Strategy

- **`main`** → Production deployment (automatic after merge)
- **`develop`** → Staging environment (automatic)
- **`feature/*`** → Preview deployments (on PR creation)
- **`release/*`** → Pre-production testing environment

## 🎯 Best Practices

### **Commit Messages**
Follow conventional commits:
```
feat: add card price history tracking
fix: resolve database connection timeout
docs: update API documentation
test: add integration tests for authentication
```

### **PR Guidelines**
- **Title**: Clear, descriptive summary
- **Description**: What, why, and how
- **Labels**: Use appropriate labels (feature, bugfix, security, etc.)
- **Reviewers**: Assign relevant team members
- **Testing**: Include testing instructions

### **Branch Naming**
- Use lowercase and hyphens
- Include issue numbers when applicable
- Keep descriptions concise but descriptive
- Examples: `feature/123-card-search`, `hotfix/critical-auth-bug`

## 🔧 Commands Reference

### **Starting Feature Development**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/123-your-feature
```

### **Creating Release**
```bash
git checkout develop
git pull origin develop
git checkout -b release/1.2.0
# Make final adjustments
git push origin release/1.2.0
```

### **Hotfix Process**
```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix
# Fix the issue
git push origin hotfix/critical-fix
```

## 📊 Branch Monitoring

Monitor branch health with:
- **Stale branches**: Delete merged feature branches
- **Long-running features**: Break into smaller PRs
- **Drift detection**: Keep feature branches updated with develop

## 🎉 Multi-Agent Integration

This branching strategy supports our multi-agent refactoring methodology:
- **Agent branches**: `feature/agent-<name>-<phase>`
- **Integration**: Merge agents to `develop` after completion
- **Validation**: Full test suite ensures agent changes don't break system

---

*This branching strategy ensures code quality, enables parallel development, and maintains production stability for the MTG Investment application.*