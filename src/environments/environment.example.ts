export const environment = {
  production: false,
  openaiApiKey: 'YOUR_OPENAI_API_KEY', // Replace with your OpenAI API key
  openWeatherApiKey: 'YOUR_OPENWEATHER_API_KEY' // Replace with your OpenWeatherMap API key (optional)
};

/*
 * Configuration Instructions for Angular 16+:
 *
 * 1. Copy this file to 'environment.development.ts' for local development
 * 2. Replace the API keys with your actual keys
 * 3. Both environment.ts and environment.development.ts are gitignored
 *
 * File structure in Angular 16+:
 * - environment.ts = production configuration
 * - environment.development.ts = development configuration
 *
 * To get API keys:
 *
 * OpenAI API key (required):
 * - Sign up at https://platform.openai.com
 * - Generate an API key in your account settings
 *
 * OpenWeatherMap API key (optional):
 * - Sign up at https://openweathermap.org/api
 * - Get a free API key
 * - If not provided, the app will use mock weather data
 *
 * Security Note:
 * - Never commit API keys to version control
 * - For production, use environment variables or secure key management
 * - Consider implementing a backend proxy for API calls
 */
