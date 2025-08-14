---
name: Hotfix Pull Request
about: Template for critical hotfix pull requests
title: 'hotfix: [Brief description of critical fix]'
labels: 'hotfix, urgent'
---

## 🚨 HOTFIX - URGENT

### **Severity Level**:
- [ ] Critical (Production down)
- [ ] High (Major functionality broken)
- [ ] Medium (Important feature impacted)

### **Issue Reference**
Fixes #<!-- critical issue number -->

## 🔥 Problem Description

### **What is broken?**
<!-- Clear description of the critical issue -->

### **Impact Assessment**
- **Users Affected**: <!-- number/percentage of users -->
- **Features Impacted**: <!-- list affected features -->
- **Business Impact**: <!-- revenue/reputation impact -->
- **Discovered**: <!-- when was this discovered -->

### **Root Cause**
<!-- Brief explanation of what caused the issue -->

## 🛠️ Solution

### **Changes Made**
- [ ] <!-- List specific changes -->

### **Why This Approach**
<!-- Justify why this is the best/safest fix -->

### **Alternative Solutions Considered**
<!-- List other approaches and why they were rejected -->

## 🧪 Testing

### **Critical Path Testing**
- [ ] Issue reproduction confirmed
- [ ] Fix resolves the issue
- [ ] No regression in critical paths
- [ ] Core functionality verified

### **Test Commands**
```bash
# Critical tests run
npm run test:critical
npm run test:integration
```

### **Manual Verification**
- [ ] Production-like environment tested
- [ ] Edge cases considered
- [ ] Performance impact minimal

## 🔒 Security Impact

- [ ] No security vulnerabilities introduced
- [ ] Data integrity maintained
- [ ] Access controls unaffected
- [ ] No sensitive data exposed

## 🚀 Deployment Plan

### **Emergency Deployment Checklist**
- [ ] Database backup completed
- [ ] Rollback plan ready
- [ ] Monitoring alerts active
- [ ] Team notifications sent

### **Deployment Steps**
1. **Immediate**: Merge to main after approval
2. **Deploy**: Emergency deployment to production
3. **Verify**: Confirm fix is working
4. **Monitor**: Watch for any side effects
5. **Merge Back**: Merge to develop branch

### **Rollback Plan**
<!-- Detailed steps to rollback if issues occur -->

## 📋 Review Requirements

### **Expedited Review**
- [ ] **Reviewer 1**: @<!-- assign critical reviewer -->
- [ ] **Security Review**: <!-- if security related -->
- [ ] **Technical Lead**: @<!-- assign tech lead -->

### **Review Criteria**
- [ ] Fix addresses the root cause
- [ ] Solution is minimal and safe
- [ ] No unnecessary changes included
- [ ] Testing is adequate for urgency level

## 🎯 MTG Investment Specific

### **Data Integrity**
- [ ] Card data remains consistent
- [ ] Price history not corrupted
- [ ] User portfolios unaffected
- [ ] Transaction records intact

### **Critical Paths**
- [ ] Price tracking functional
- [ ] User authentication working
- [ ] API endpoints responding
- [ ] Database connections stable

## 📊 Monitoring

### **Key Metrics to Watch**
- [ ] Error rates
- [ ] Response times
- [ ] Database performance
- [ ] User activity levels

### **Success Criteria**
- [ ] Issue fully resolved
- [ ] No new errors introduced
- [ ] Performance maintained
- [ ] User experience restored

## 📞 Communication Plan

### **Stakeholder Notifications**
- [ ] Development team alerted
- [ ] Product owner informed
- [ ] Users notified (if needed)
- [ ] Support team briefed

### **Post-fix Actions**
- [ ] Incident report created
- [ ] Post-mortem scheduled
- [ ] Process improvements identified
- [ ] Documentation updated

## ✅ Emergency Approval

**This hotfix is ready for emergency deployment:**
- [ ] Critical issue confirmed
- [ ] Minimal, safe fix implemented
- [ ] Testing completed within time constraints
- [ ] Rollback plan prepared
- [ ] All stakeholders notified

---

**⚠️ EMERGENCY DEPLOYMENT AUTHORIZATION**

By approving this PR, you confirm:
1. The fix addresses a critical production issue
2. The solution is minimal and low-risk
3. Emergency deployment is justified
4. Proper monitoring will be in place

**Approved by**: <!-- Emergency approver name and timestamp -->
**Deploy immediately upon merge**: [ ] YES / [ ] NO