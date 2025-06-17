#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 MetroSocial Supabase Setup Assistant\n');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: package.json not found. Please run this script from your project root.');
  process.exit(1);
}

// Check if Supabase client is installed
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const hasSupabase = packageJson.dependencies && packageJson.dependencies['@supabase/supabase-js'];

if (!hasSupabase) {
  console.log('📦 Installing Supabase client...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install @supabase/supabase-js', { stdio: 'inherit' });
    console.log('✅ Supabase client installed successfully!\n');
  } catch (error) {
    console.error('❌ Error installing Supabase client:', error.message);
    process.exit(1);
  }
}

// Check for environment file
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log('🔧 Environment Setup:');
if (envExists) {
  console.log('✅ .env.local file found');
  
  // Read and validate environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('REACT_APP_SUPABASE_URL');
  const hasSupabaseKey = envContent.includes('REACT_APP_SUPABASE_ANON_KEY');
  
  if (hasSupabaseUrl && hasSupabaseKey) {
    console.log('✅ Supabase environment variables configured');
  } else {
    console.log('⚠️  Missing Supabase environment variables');
    console.log('   Please add to .env.local:');
    console.log('   REACT_APP_SUPABASE_URL=your_supabase_url');
    console.log('   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key');
  }
} else {
  console.log('⚠️  .env.local file not found');
  console.log('   Creating template .env.local file...');
  
  const envTemplate = `# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Development
REACT_APP_SOCKET_SERVER_URL=http://localhost:5000
`;
  
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Template .env.local created');
  console.log('   Please update with your actual Supabase credentials');
}

console.log('\n📋 Required Files:');

// Check for required files
const requiredFiles = [
  { path: 'src/config/supabase.ts', name: 'Supabase configuration' },
  { path: 'src/services/supabaseService.ts', name: 'Supabase services' },
  { path: 'supabase-schema.sql', name: 'Database schema' }
];

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file.name} found`);
  } else {
    console.log(`❌ ${file.name} missing`);
  }
});

console.log('\n🎯 Next Steps:');
console.log('1. Create your Supabase project at https://supabase.com');
console.log('2. Update .env.local with your project credentials');
console.log('3. Run the schema SQL in your Supabase SQL Editor');
console.log('4. Test the application with: npm start');
console.log('5. Follow the complete guide in SUPABASE_DEPLOYMENT_GUIDE.md');

console.log('\n📚 Resources:');
console.log('• Deployment Guide: SUPABASE_DEPLOYMENT_GUIDE.md');
console.log('• Database Schema: supabase-schema.sql');
console.log('• Supabase Docs: https://supabase.com/docs');
console.log('• MetroSocial Repo: https://github.com/Danielopol/Metrosocial');

console.log('\n🎉 Ready to deploy with Supabase!');

// Exit with appropriate code
const allFilesExist = requiredFiles.every(file => 
  fs.existsSync(path.join(process.cwd(), file.path))
);

if (allFilesExist && envExists) {
  console.log('\n✅ All setup files are ready!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some setup steps remaining. Please complete them before deployment.');
  process.exit(1);
} 