---
name: Release Pull Request
about: Template for release branch pull requests to main
title: 'release: Version [X.Y.Z]'
labels: 'release'
---

## 🚀 Release Information

### **Version**: `v[X.Y.Z]`
### **Release Type**: 
- [ ] Major (breaking changes)
- [ ] Minor (new features)  
- [ ] Patch (bug fixes)
- [ ] Hotfix (critical fixes)

### **Release Branch**: `release/[X.Y.Z]`

## 📋 Release Contents

### **New Features**
<!-- List all new features in this release -->
- 

### **Enhancements**
<!-- List all improvements and enhancements -->
- 

### **Bug Fixes**
<!-- List all bug fixes -->
- 

### **Breaking Changes**
<!-- List any breaking changes -->
- [ ] None
- 

## 🧪 Release Testing

### **Testing Completed**
- [ ] Full regression testing
- [ ] Performance testing
- [ ] Security testing
- [ ] Database migration testing
- [ ] Browser compatibility testing
- [ ] Mobile responsiveness testing

### **Quality Gates**
- [ ] All CI/CD checks pass
- [ ] Code coverage ≥ 70%
- [ ] Security audit clean
- [ ] Performance benchmarks met
- [ ] No critical vulnerabilities

## 📚 Documentation

### **Updated Documentation**
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] Deployment guide updated

### **Release Notes**
<!-- Summary for end users -->

## 🔄 Deployment Plan

### **Pre-deployment Checklist**
- [ ] Staging environment tested
- [ ] Database backup completed
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

### **Deployment Steps**
1. Merge to main
2. Tag release: `git tag v[X.Y.Z]`
3. Deploy to production
4. Verify deployment
5. Monitor for issues

### **Post-deployment Actions**
- [ ] Merge main back to develop
- [ ] Update staging environment
- [ ] Close related issues
- [ ] Announce release

## 🎯 MTG Investment Specific

### **Database Changes**
- [ ] Schema migrations tested
- [ ] Price data migration verified
- [ ] Card data integrity maintained
- [ ] Investment calculations accurate

### **Performance Impact**
- [ ] Query performance analyzed
- [ ] Large dataset handling tested
- [ ] API response times verified
- [ ] Price tracking accuracy confirmed

## 🚨 Risk Assessment

### **Risk Level**: 
- [ ] Low (minor changes)
- [ ] Medium (moderate impact)
- [ ] High (significant changes)

### **Mitigation Strategies**
<!-- List strategies to mitigate identified risks -->

## ✅ Release Approval

### **Approvers Required**
- [ ] Technical Lead
- [ ] Product Owner
- [ ] Security Review (if applicable)

### **Sign-off Checklist**
- [ ] Code review completed
- [ ] Testing sign-off
- [ ] Documentation review
- [ ] Security clearance
- [ ] Product acceptance

## 📊 Metrics & KPIs

### **Success Criteria**
- [ ] Zero critical issues post-deployment
- [ ] Performance targets met
- [ ] User acceptance criteria satisfied
- [ ] No security vulnerabilities introduced

---

**Release Notes for Users:**
<!-- Include user-facing release notes here -->