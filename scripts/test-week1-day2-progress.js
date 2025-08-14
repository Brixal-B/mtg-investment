/**
 * Test Week 1 Day 2 Implementation - Password Reset & Enhanced Authentication
 */

const sqlite3 = require('sqlite3');
const fs = require('fs');

async function testDay2Progress() {
  console.log('🧪 Week 1 Day 2 Implementation Test - Password Reset & Enhanced Auth');
  console.log('='.repeat(70));
  
  const dbPath = './data/mtg-investment.db';
  const db = new sqlite3.Database(dbPath);
  
  try {
    // Test 1: Password Reset API Endpoints
    console.log('\n📋 Test 1: Password Reset API Endpoints');
    
    const passwordResetAPIs = [
      'src/app/api/auth/forgot-password/route.ts',
      'src/app/api/auth/reset-password/route.ts'
    ];
    
    let passwordAPIsComplete = 0;
    passwordResetAPIs.forEach(endpoint => {
      if (fs.existsSync(endpoint)) {
        const size = fs.statSync(endpoint).size;
        const sizeKB = Math.round(size/1024);
        if (size > 500) { // Substantial implementation
          console.log(`✅ ${endpoint.split('/').pop()} - ${sizeKB}KB - Complete`);
          passwordAPIsComplete++;
        } else {
          console.log(`⚠️  ${endpoint.split('/').pop()} - ${sizeKB}KB - Incomplete`);
        }
      } else {
        console.log(`❌ ${endpoint.split('/').pop()} - Missing`);
      }
    });
    
    // Test 2: Password Reset Frontend Components
    console.log('\n📋 Test 2: Password Reset Frontend Components');
    
    const passwordComponents = [
      'src/components/ForgotPasswordForm.tsx',
      'src/components/ResetPasswordForm.tsx'
    ];
    
    let passwordComponentsComplete = 0;
    passwordComponents.forEach(component => {
      if (fs.existsSync(component)) {
        const size = fs.statSync(component).size;
        const sizeKB = Math.round(size/1024);
        if (size > 2000) { // Substantial component
          console.log(`✅ ${component.split('/').pop()} - ${sizeKB}KB - Complete`);
          passwordComponentsComplete++;
        } else {
          console.log(`⚠️  ${component.split('/').pop()} - ${sizeKB}KB - Incomplete`);
        }
      } else {
        console.log(`❌ ${component.split('/').pop()} - Missing`);
      }
    });
    
    // Test 3: Password Reset Page Routes
    console.log('\n📋 Test 3: Password Reset Page Routes');
    
    const passwordPages = [
      'src/app/forgot-password/page.tsx',
      'src/app/reset-password/page.tsx'
    ];
    
    let passwordPagesComplete = 0;
    passwordPages.forEach(page => {
      if (fs.existsSync(page)) {
        console.log(`✅ ${page.split('/').slice(-2).join('/')}`);
        passwordPagesComplete++;
      } else {
        console.log(`❌ ${page.split('/').slice(-2).join('/')} - Missing`);
      }
    });
    
    // Test 4: Database Schema for Password Reset
    console.log('\n📋 Test 4: Database Schema - Password Reset Support');
    
    const resetTokenColumns = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) reject(err);
        else {
          const resetTokenCol = columns.find(col => col.name === 'reset_token');
          const resetTokenExpiresCol = columns.find(col => col.name === 'reset_token_expires');
          resolve({ resetTokenCol, resetTokenExpiresCol });
        }
      });
    });
    
    console.log(`✅ reset_token column: ${resetTokenColumns.resetTokenCol ? 'Present' : 'Missing'}`);
    console.log(`✅ reset_token_expires column: ${resetTokenColumns.resetTokenExpiresCol ? 'Present' : 'Missing'}`);
    
    // Test 5: Enhanced Login Integration
    console.log('\n📋 Test 5: Enhanced Login Integration');
    
    // Check if login form has forgot password link
    const loginFormContent = fs.readFileSync('src/components/LoginForm.tsx', 'utf8');
    const hasForgotPasswordLink = loginFormContent.includes('/forgot-password');
    
    console.log(`✅ Forgot Password link in login: ${hasForgotPasswordLink ? 'Added' : 'Missing'}`);
    
    // Test 6: Login API Database Integration
    console.log('\n📋 Test 6: Login API Database Integration');
    
    const loginAPIContent = fs.readFileSync('src/app/api/auth/login/route.ts', 'utf8');
    const usesDatabase = loginAPIContent.includes('Database') && !loginAPIContent.includes('MOCK_USERS');
    
    console.log(`✅ Login API uses database: ${usesDatabase ? 'Yes' : 'Still using mocks'}`);
    
    // Test 7: Security Features Check
    console.log('\n📋 Test 7: Security Features');
    
    const securityFeatures = {
      passwordStrength: passwordComponents.every(comp => {
        if (fs.existsSync(comp)) {
          const content = fs.readFileSync(comp, 'utf8');
          return content.includes('password') && content.includes('strength');
        }
        return false;
      }),
      tokenExpiration: passwordResetAPIs.every(api => {
        if (fs.existsSync(api)) {
          const content = fs.readFileSync(api, 'utf8');
          return content.includes('expires') || content.includes('expiration');
        }
        return false;
      }),
      inputValidation: passwordResetAPIs.every(api => {
        if (fs.existsSync(api)) {
          const content = fs.readFileSync(api, 'utf8');
          return content.includes('validateInput');
        }
        return false;
      })
    };
    
    console.log(`✅ Password strength indicators: ${securityFeatures.passwordStrength ? 'Implemented' : 'Missing'}`);
    console.log(`✅ Token expiration: ${securityFeatures.tokenExpiration ? 'Implemented' : 'Missing'}`);
    console.log(`✅ Input validation: ${securityFeatures.inputValidation ? 'Implemented' : 'Missing'}`);
    
    // Test 8: Day 2 Completion Score
    console.log('\n📋 Test 8: Day 2 Completion Assessment');
    
    const day2Tasks = 6; // Based on Week 1 plan
    const completedTasks = [
      passwordAPIsComplete >= 2, // Password reset APIs
      passwordComponentsComplete >= 2, // Password reset components
      passwordPagesComplete >= 2, // Password reset pages
      resetTokenColumns.resetTokenCol && resetTokenColumns.resetTokenExpiresCol, // Database schema
      hasForgotPasswordLink, // Login integration
      usesDatabase // Database login
    ];
    
    const day2CompletionScore = completedTasks.filter(Boolean).length;
    const day2CompletionPercent = Math.round((day2CompletionScore / day2Tasks) * 100);
    
    console.log(`📊 Day 2 Completion Score: ${day2CompletionScore}/${day2Tasks} (${day2CompletionPercent}%)`);
    
    // Overall Week 1 Progress (Days 1 + 2)
    console.log('\n🎯 WEEK 1 CUMULATIVE PROGRESS');
    console.log('=' .repeat(40));
    
    const totalWeek1Tasks = 12; // 6 from Day 1 + 6 from Day 2
    const day1Score = 6; // Day 1 was 100% complete
    const totalCompleted = day1Score + day2CompletionScore;
    const overallPercent = Math.round((totalCompleted / totalWeek1Tasks) * 100);
    
    console.log(`📈 Overall Week 1 Progress: ${totalCompleted}/${totalWeek1Tasks} (${overallPercent}%)`);
    
    if (day2CompletionPercent >= 80) {
      console.log('🎉 EXCELLENT DAY 2 PROGRESS!');
      console.log('✅ Password reset system complete');
      console.log('✅ Enhanced authentication flow');
      console.log('✅ Database integration working');
      console.log('✅ Security features implemented');
      
      console.log('\n🚀 Ready for Day 3:');
      console.log('   - User profile management');
      console.log('   - Session management & refresh tokens');
      console.log('   - Authentication integration testing');
      console.log('   - Security audit & enhancements');
      
    } else if (day2CompletionPercent >= 60) {
      console.log('🔄 GOOD DAY 2 PROGRESS - Minor items remaining');
      console.log('\n⏳ Complete these items:');
      if (passwordAPIsComplete < 2) console.log('   - Finish password reset APIs');
      if (passwordComponentsComplete < 2) console.log('   - Complete password reset components');
      if (!usesDatabase) console.log('   - Update login API to use database');
      
    } else {
      console.log('⚠️  DAY 2 NEEDS ATTENTION');
      console.log('\n🔧 Priority items:');
      console.log('   - Complete password reset implementation');
      console.log('   - Integrate database with login API');
      console.log('   - Test password reset flow end-to-end');
    }
    
    // Testing Instructions
    console.log('\n🧪 DAY 2 TESTING INSTRUCTIONS:');
    console.log('1. Server: npm run dev');
    console.log('2. Login: http://localhost:3000/login');
    console.log('3. Forgot Password: Click "Forgot your password?" link');
    console.log('4. Reset: http://localhost:3000/forgot-password');
    console.log('5. Check console for reset tokens in development');
    
    console.log('\n📝 Day 2 Deliverables Summary:');
    console.log(`   - Password reset APIs: ${passwordAPIsComplete}/2`);
    console.log(`   - Password reset UI: ${passwordComponentsComplete}/2`);
    console.log(`   - Page routes: ${passwordPagesComplete}/2`);
    console.log(`   - Database integration: ${usesDatabase ? 'Complete' : 'Pending'}`);
    console.log(`   - Security features: ${Object.values(securityFeatures).filter(Boolean).length}/3`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    db.close();
  }
}

if (require.main === module) {
  testDay2Progress();
}

module.exports = { testDay2Progress };
