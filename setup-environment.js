const fs = require('fs');
const path = require('path');

// Define the paths
const envDir = path.join(__dirname, 'src', 'environments');
const exampleFile = path.join(envDir, 'environment.example.ts');
const devFile = path.join(envDir, 'environment.development.ts');
const prodFile = path.join(envDir, 'environment.ts');

// Check if environment files already exist
if (fs.existsSync(devFile)) {
  console.log('✅ environment.development.ts already exists');
} else if (fs.existsSync(exampleFile)) {
  // Copy example to development environment file
  fs.copyFileSync(exampleFile, devFile);
  console.log('✅ Created environment.development.ts from environment.example.ts');
  console.log('⚠️  Remember to update your API keys in environment.development.ts');
} else {
  console.error('❌ environment.example.ts not found!');
}

// Create production environment if it doesn't exist
if (!fs.existsSync(prodFile)) {
  const prodContent = `export const environment = {
  production: true,
  openaiApiKey: process.env['OPENAI_API_KEY'] || '', // Use environment variables in production!
  openWeatherApiKey: process.env['OPENWEATHER_API_KEY'] || ''
};
`;
  fs.writeFileSync(prodFile, prodContent);
  console.log('✅ Created environment.ts (production)');
}

console.log('\n📝 Next steps:');
console.log('1. Edit src/environments/environment.development.ts');
console.log('2. Add your OpenAI API key');
console.log('3. Optionally add your OpenWeatherMap API key');
console.log('\n🔒 Your API keys will not be committed to git');
console.log('\n💡 For production deployment:');
console.log('   Set OPENAI_API_KEY and OPENWEATHER_API_KEY as environment variables');
