# 🚀 Developer Guide - Git Workflow

## 📋 Quick Start

### **Setting Up Your Local Environment**

```bash
# Clone the repository
git clone https://github.com/Brixal-B/mtg-investment.git
cd mtg-investment

# Install dependencies
npm install

# Fetch all branches
git fetch --all

# Set up main branches locally
git checkout main
git checkout develop
```

## 🌟 Daily Workflow

### **Starting a New Feature**

```bash
# 1. Switch to develop and pull latest changes
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/123-add-card-search

# 3. Work on your feature
# ... make your changes ...

# 4. Commit changes (follow conventional commits)
git add .
git commit -m "feat: add advanced card search functionality"

# 5. Push feature branch
git push origin feature/123-add-card-search

# 6. Create Pull Request to develop
```

### **Feature Development Best Practices**

#### **Branch Naming Convention**
- `feature/<issue-number>-<short-description>`
- Use lowercase with hyphens
- Keep descriptions concise but clear

**Good Examples:**
```
feature/123-card-price-tracking
feature/456-user-authentication
feature/789-portfolio-dashboard
feature/101-api-rate-limiting
```

**Bad Examples:**
```
feature/CardSearch          # No issue number
feature/123_add_search      # Underscores instead of hyphens
feature/123-Add-Search      # Capital letters
my-feature                  # Doesn't follow convention
```

#### **Commit Message Convention**
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature additions
git commit -m "feat: add card search with filters"
git commit -m "feat(api): implement price history endpoint"

# Bug fixes
git commit -m "fix: resolve database connection timeout"
git commit -m "fix(ui): correct card image aspect ratio"

# Documentation
git commit -m "docs: update API documentation"

# Tests
git commit -m "test: add integration tests for auth"

# Refactoring
git commit -m "refactor: optimize price calculation algorithm"

# Chores
git commit -m "chore: update dependencies"
```

## 🔄 Common Workflows

### **1. Feature Development Workflow**

```bash
# Start feature
git checkout develop
git pull origin develop
git checkout -b feature/123-new-feature

# Development cycle
echo "Make changes..."
git add .
git commit -m "feat: implement core functionality"

echo "More changes..."
git add .
git commit -m "test: add unit tests"

echo "Final touches..."
git add .
git commit -m "docs: update component documentation"

# Keep feature updated with develop
git fetch origin
git rebase origin/develop

# Push and create PR
git push origin feature/123-new-feature
# Create PR via GitHub UI targeting develop
```

### **2. Keeping Feature Branch Updated**

```bash
# Method 1: Rebase (preferred - cleaner history)
git checkout feature/123-my-feature
git fetch origin
git rebase origin/develop

# Handle conflicts if any
git add .
git rebase --continue

git push --force-with-lease origin feature/123-my-feature

# Method 2: Merge (if you prefer merge commits)
git checkout feature/123-my-feature
git fetch origin
git merge origin/develop

git push origin feature/123-my-feature
```

### **3. Code Review Process**

#### **Creating a Pull Request**
1. **Push your feature branch**
2. **Navigate to GitHub repository**
3. **Click "Compare & pull request"**
4. **Select template**: Choose appropriate PR template
5. **Fill out template**: Complete all required sections
6. **Add reviewers**: Assign relevant team members
7. **Add labels**: Use appropriate labels (feature, bug, etc.)

#### **Responding to Review Feedback**
```bash
# Make requested changes
echo "Fix review comments..."
git add .
git commit -m "fix: address code review feedback"

# Update PR
git push origin feature/123-my-feature
```

#### **After PR Approval**
```bash
# Merge is done via GitHub UI
# Your feature branch will be automatically deleted

# Clean up local branches
git checkout develop
git pull origin develop
git branch -d feature/123-my-feature
```

### **4. Release Workflow**

#### **Preparing a Release** (Maintainers only)
```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/1.2.0

# 2. Update version numbers
npm version 1.2.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: bump version to 1.2.0"

# 3. Update CHANGELOG.md
echo "Update CHANGELOG.md with release notes..."
git add CHANGELOG.md
git commit -m "docs: update changelog for v1.2.0"

# 4. Push release branch
git push origin release/1.2.0

# 5. Create PR to main
# Create PR via GitHub UI targeting main

# 6. After merge, tag the release
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# 7. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### **5. Hotfix Workflow**

#### **Critical Production Fix**
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Make the fix
echo "Fix critical issue..."
git add .
git commit -m "fix: resolve critical security vulnerability"

# 3. Push hotfix branch
git push origin hotfix/critical-security-patch

# 4. Create PRs to both main and develop
# Create PR to main (for immediate deployment)
# Create PR to develop (to include fix in next release)

# 5. After merge, clean up
git checkout main
git branch -d hotfix/critical-security-patch
```

## 🛠️ Useful Git Commands

### **Branch Management**
```bash
# List all branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename current branch
git branch -m new-branch-name

# See which branches are merged
git branch --merged develop
```

### **Working with Remotes**
```bash
# Add upstream remote (if forked)
git remote add upstream https://github.com/Brixal-B/mtg-investment.git

# Fetch all remotes
git fetch --all

# Update from upstream
git checkout develop
git pull upstream develop
git push origin develop
```

### **Undoing Changes**
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to specific file
git checkout -- filename.js

# Interactive rebase to clean up commits
git rebase -i HEAD~3
```

### **Debugging and History**
```bash
# See branch history graphically
git log --oneline --graph --all

# Find when something was changed
git log -p -- filename.js

# See what changed between branches
git diff develop..feature/my-branch

# Find which commit introduced a bug
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
```

## 🎯 MTG Investment Specific Guidelines

### **Database Changes**
When working with database changes:
```bash
# Always test migrations locally
npm run db:migrate

# Add migration files to your commits
git add db/migrations/
git commit -m "feat: add card_favorites table migration"
```

### **API Changes**
For API modifications:
```bash
# Update API documentation
git add docs/api/
git commit -m "docs: update price history API documentation"

# Include API tests
git add src/test/api/
git commit -m "test: add tests for new price endpoints"
```

### **Performance Considerations**
```bash
# Test with large datasets
npm run test:performance

# Profile your changes
npm run profile

# Check bundle size impact
npm run analyze
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Merge Conflicts**
```bash
# During rebase
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git rebase --continue

# During merge
git status  # See conflicted files
# Edit files to resolve conflicts
git add .
git commit
```

#### **Branch Diverged**
```bash
# If your branch has diverged from origin
git fetch origin
git reset --hard origin/feature/my-branch

# Or if you want to keep local changes
git fetch origin
git rebase origin/feature/my-branch
```

#### **Accidentally Committed to Wrong Branch**
```bash
# Move commits to correct branch
git checkout correct-branch
git cherry-pick commit-hash

git checkout wrong-branch
git reset --hard HEAD~1  # Remove the commit
```

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [MTG Investment API Docs](./docs/api/)

## 🆘 Getting Help

If you're stuck:
1. **Check this guide** for common workflows
2. **Search previous issues** on GitHub
3. **Ask in team chat** for quick questions
4. **Create a discussion** on GitHub for complex topics

---

*Happy coding! 🎉*