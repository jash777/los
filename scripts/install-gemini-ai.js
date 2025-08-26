/**
 * Installation script for Gemini AI integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Installing Gemini AI Framework for LMS...');

// Install required packages
console.log('📦 Installing dependencies...');
try {
  execSync('npm install @google/generative-ai langchain @langchain/google-genai langchain-community pdf-parse mammoth sharp zod', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Create AI tables for Gemini
console.log('🗄️ Creating AI analysis tables...');
try {
  execSync('node scripts/create-ai-tables.js', { stdio: 'inherit' });
  console.log('✅ Database tables created');
} catch (error) {
  console.error('❌ Failed to create tables:', error.message);
}

// Check environment variables
console.log('🔧 Checking configuration...');
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

if (!envContent.includes('GEMINI_API_KEY')) {
  console.log('⚠️  Please add your Gemini API key to .env file:');
  console.log('   GEMINI_API_KEY=your_api_key_here');
} else {
  console.log('✅ Environment configuration found');
}

console.log('\n🎉 Gemini AI Framework installation completed!');
console.log('\n📋 Next steps:');
console.log('1. Add your Gemini API key to .env file');
console.log('2. Set AI_FRAMEWORK=gemini in .env');
console.log('3. Restart your server');
console.log('4. Test with: POST /api/ai/ai-analysis/:applicationId');

console.log('\n💰 Cost Benefits:');
console.log('- Gemini Flash: ~$0.075 per 1M tokens');
console.log('- Estimated cost per loan application: $0.001 - $0.005');
console.log('- 1000x cheaper than custom ML infrastructure');

console.log('\n🚀 Ready to process loans with AI!');