---
name: Feature Pull Request
about: Template for feature branch pull requests
title: 'feat: [Brief description of feature]'
labels: 'feature'
---

## 🎯 Feature Description

### **What does this PR do?**
<!-- Brief description of the feature or enhancement -->

### **Issue Reference**
Fixes #<!-- issue number -->
Related to #<!-- related issue numbers -->

## 🔄 Changes Made

### **New Features**
- [ ] <!-- List new features added -->

### **Enhancements**
- [ ] <!-- List improvements to existing features -->

### **Breaking Changes**
- [ ] <!-- List any breaking changes (if none, remove this section) -->

## 🧪 Testing

### **Test Coverage**
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### **Test Commands**
```bash
# Commands used to test this feature
npm run test:unit
npm run test:integration
npm run test:e2e
```

### **Testing Checklist**
- [ ] All existing tests pass
- [ ] New tests cover edge cases
- [ ] Performance impact tested
- [ ] Browser compatibility verified (if UI changes)

## 📚 Documentation

### **Documentation Updates**
- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Comments added to complex code

### **Code Quality**
- [ ] TypeScript types properly defined
- [ ] ESLint passes without warnings
- [ ] Code follows project conventions
- [ ] No console.log statements in production code

## 🔒 Security Considerations

- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Authorization checks in place
- [ ] Security tests added (if applicable)

## 📱 UI/UX (if applicable)

### **Screenshots/GIFs**
<!-- Add before/after screenshots or demo GIFs -->

### **Responsive Design**
- [ ] Mobile responsive
- [ ] Tablet responsive  
- [ ] Desktop optimized
- [ ] Accessibility guidelines followed

## 🚀 Deployment Notes

### **Environment Variables**
<!-- List any new environment variables needed -->

### **Database Changes**
- [ ] Migrations included
- [ ] Backward compatible
- [ ] Data migration tested

### **Dependencies**
- [ ] New dependencies justified
- [ ] Package.json updated
- [ ] Security audit passed

## 📋 Review Checklist

### **Code Review**
- [ ] Code is readable and well-organized
- [ ] Functions are properly documented
- [ ] Error handling is comprehensive
- [ ] Performance optimizations considered

### **MTG Domain Specific**
- [ ] Card data handling is correct
- [ ] Price tracking logic is accurate
- [ ] Investment calculations verified
- [ ] Database schema follows 4-table design

## 🎭 Multi-Agent Integration

### **Agent Phase** (if applicable)
- [ ] Phase 1: Foundation
- [ ] Phase 2: Infrastructure  
- [ ] Phase 3: Optimization
- [ ] Standalone feature

### **Agent Handoff**
- [ ] Previous agent requirements satisfied
- [ ] Clean handoff to next agent
- [ ] Documentation updated for methodology

## ✅ Pre-merge Checklist

- [ ] Branch is up to date with develop
- [ ] All CI checks pass
- [ ] Code review completed
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Ready for merge

## 🔄 Post-merge Actions

- [ ] Feature branch will be deleted
- [ ] Staging deployment verified
- [ ] Monitoring alerts configured
- [ ] Release notes updated

---

**Additional Notes:**
<!-- Add any additional context, concerns, or information for reviewers -->