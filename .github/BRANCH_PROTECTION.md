# 🔒 Branch Protection Configuration

## Setup Instructions

To configure branch protection rules for this repository, navigate to:
**Settings → Branches → Add rule**

## Protection Rules

### 🎯 **Main Branch Protection**

**Branch name pattern**: `main`

#### **Protect matching branches**
- [x] Restrict pushes that create matching branches
- [x] Restrict pushes that create matching branches

#### **Rules applied to everyone including administrators**
- [x] Require a pull request before merging
  - [x] Require approvals: **2**
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from code owners
  - [x] Restrict pushes that create matching branches
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (18.x)`
    - `test (20.x)` 
    - `build`
    - `security`
- [x] Require conversation resolution before merging
- [x] Require signed commits
- [x] Include administrators
- [x] Restrict pushes to matching branches
- [x] Allow force pushes: **Nobody**
- [x] Allow deletions: **Nobody**

### 🚀 **Develop Branch Protection**

**Branch name pattern**: `develop`

#### **Protect matching branches**
- [x] Restrict pushes that create matching branches

#### **Rules applied to everyone including administrators**
- [x] Require a pull request before merging
  - [x] Require approvals: **1**
  - [x] Dismiss stale PR approvals when new commits are pushed
  - [x] Require review from code owners
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (18.x)`
    - `test (20.x)`
    - `build`
- [x] Require conversation resolution before merging
- [x] Allow force pushes: **Specify who can force push** (Maintainers only)
- [x] Allow deletions: **Nobody**

### 🌟 **Feature Branch Protection**

**Branch name pattern**: `feature/*`

#### **Protect matching branches**
- [x] Restrict pushes that create matching branches

#### **Rules applied to everyone including administrators**
- [x] Require status checks to pass before merging
  - **Required status checks:**
    - `test (18.x)`
    - `test (20.x)`
- [x] Allow force pushes: **Specify who can force push** (Contributors and above)
- [x] Allow deletions: **Specify who can delete** (Contributors and above)

### 🔧 **Release Branch Protection**

**Branch name pattern**: `release/*`

#### **Protect matching branches**
- [x] Restrict pushes that create matching branches

#### **Rules applied to everyone including administrators**
- [x] Require a pull request before merging
  - [x] Require approvals: **1**
  - [x] Require review from code owners
- [x] Require status checks to pass before merging
  - [x] Require branches to be up to date before merging
  - **Required status checks:**
    - `test (18.x)`
    - `test (20.x)`
    - `build`
    - `security`
- [x] Require conversation resolution before merging
- [x] Allow deletions: **Nobody**

### 🚨 **Hotfix Branch Protection**

**Branch name pattern**: `hotfix/*`

#### **Protect matching branches**
- [x] Restrict pushes that create matching branches

#### **Rules applied to everyone including administrators**
- [x] Require a pull request before merging
  - [x] Require approvals: **1**
  - [x] Require review from code owners
- [x] Require status checks to pass before merging
  - **Required status checks:**
    - `test (18.x)`
    - `test (20.x)`
    - `security`
- [x] Require conversation resolution before merging
- [x] Allow deletions: **Specify who can delete** (Maintainers only)

## 🎯 Rulesets (Alternative Configuration)

If using GitHub's newer Rulesets feature, create these rulesets:

### **Production Protection** (`main`)
```yaml
name: "Production Protection"
target: branch
includes: ["main"]
rules:
  - required_status_checks
  - pull_request_required
  - required_deployments
  - non_fast_forward
  - deletion
```

### **Integration Protection** (`develop`)
```yaml
name: "Integration Protection"  
target: branch
includes: ["develop"]
rules:
  - required_status_checks
  - pull_request_required
  - non_fast_forward
```

### **Feature Protection** (`feature/*`)
```yaml
name: "Feature Protection"
target: branch
includes: ["feature/*"]
rules:
  - required_status_checks
```

## 🤖 Automation

### **Auto-delete merged branches**
Configure automatic deletion of feature branches after merge in:
**Settings → General → Pull Requests**
- [x] Automatically delete head branches

### **Branch cleanup action**
Consider adding a workflow to clean up stale branches:

```yaml
name: Cleanup Stale Branches
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/stale@v8
        with:
          stale-branch-days: 30
          delete-branch: true
```

## 📋 Validation Checklist

After setting up branch protection:

- [ ] `main` requires 2 reviewers and all status checks
- [ ] `develop` requires 1 reviewer and status checks  
- [ ] `feature/*` branches require status checks only
- [ ] `release/*` branches require reviews and full checks
- [ ] `hotfix/*` branches require expedited review process
- [ ] Auto-delete merged feature branches enabled
- [ ] All team members understand the workflow
- [ ] Documentation is accessible and up-to-date

---

*These protection rules ensure code quality while enabling efficient development workflows.*