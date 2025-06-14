# RAG & Function Calling Chat App

A minimalistic Angular chat application demonstrating OpenAI's RAG (Retrieval-Augmented Generation) and function calling capabilities.

## Features

### 🌤️ RAG (Retrieval-Augmented Generation)
- Real-time weather data integration using OpenWeatherMap API
- Automatically detects when users ask about weather in specific cities
- Enhances AI responses with current weather information
- Toggle RAG on/off to see the difference

### 🛠️ Function Calling
- **Compound Interest Calculator**: Calculate investment returns with customizable parameters
- **BMI Calculator**: Calculate Body Mass Index with metric/imperial unit support
- Structured output with precise calculations
- Toggle functions on/off to control behavior

### 💬 Chat Interface
- Clean, responsive Material Design UI
- Real-time message streaming
- Timestamp tracking
- Visual indicators for RAG and function calls
- Example suggestions for quick testing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Angular CLI (`npm install -g @angular/cli`)
- OpenAI API key
- OpenWeatherMap API key (optional, for real weather data)

### Installation

1. **Create a new Angular project:**
```bash
ng new rag-function-chat-app --routing=false --style=css
cd rag-function-chat-app
```

2. **Install required dependencies:**
```bash
# Angular Material
ng add @angular/material

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Configure Tailwind CSS:**
   Update `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/styles.css`:
```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';
```

4. **Add the provided files:**
- Copy all the TypeScript service files to `src/app/services/`
- Copy the chat component files to `src/app/chat/`
- Replace `src/app/app.module.ts` with the provided version
- Replace `src/app/app.component.ts` with the provided version
- Copy `.gitignore` to your project root
- Copy `environment.example.ts` to `src/environments/`

5. **Set up environment files (Angular 16+):**
```bash
# Generate environment files if they don't exist
ng generate environments

# Run the setup script to create environment files from examples
node setup-environment.js
```

6. **Configure API Keys:**

Edit `src/environments/environment.development.ts` (this file is gitignored):
```typescript
export const environment = {
  production: false,
  openaiApiKey: 'your-actual-openai-api-key-here',
  openWeatherApiKey: 'your-actual-openweather-api-key-here' // optional
};
```

### Security Best Practices

🔒 **Protecting Your API Keys:**

1. **Never commit real API keys** - The `.gitignore` file excludes all environment files
2. **Use example files** - `environment.example.ts` shows the structure without real keys
3. **Fresh clone setup** - When cloning on a new machine:
   ```bash
   # Copy the example to create your local environment file
   cp src/environments/environment.example.ts src/environments/environment.development.ts
   # Then add your API keys to the new file
   ```

4. **Angular 16+ Environment Files:**
  - `environment.development.ts` - Used for `ng serve` (development)
  - `environment.ts` - Used for `ng build` (production)
  - Both are gitignored to protect your keys

5. **Production deployment** - Use environment variables:
  - Deploy through a CI/CD pipeline that injects secrets
  - Use services like Vercel, Netlify, or Azure that support environment variables
  - Never hardcode production API keys

### Running the Application

```bash
ng serve
```

Navigate to `http://localhost:4200`

## Usage Examples

### Weather Queries (RAG)
- "What's the weather like in London?"
- "Tell me about the weather in Tokyo and New York"
- "Is it raining in Paris?"

### Function Calling
- "Calculate compound interest for $10,000 at 5% for 10 years"
- "What's the compound interest on $5000 at 7% annual rate for 5 years, compounded monthly?"
- "What's my BMI if I weigh 70kg and I'm 1.75m tall?"
- "Calculate BMI for 154 pounds and 5 feet 10 inches"

### Combined Usage
- "What's the weather in London? Also, calculate my BMI if I'm 180cm and 75kg"
- "I have $20,000 to invest. What's the weather like in New York? Calculate returns at 6% for 15 years"

### Voice Input with Auto-Send
1. **Enable Auto-send** toggle in the header (on by default)
2. **Click the microphone** button
3. **Speak your query** clearly
4. **Stop speaking** - the message will automatically send after a brief pause
5. **Or click the microphone again** to stop without auto-sending

### Voice Input without Auto-Send
1. **Disable Auto-send** toggle in the header
2. **Click the microphone** and speak
3. **Review the transcribed text** in the input field
4. **Edit if needed**, then click send

### Voice Input Examples
- "What's the weather like in London?"
- "Calculate the mortgage payment for a five hundred thousand dollar home"
- "Show me compound interest on twenty thousand dollars at six percent"

## Architecture

### Services

1. **OpenAIService**
  - Handles communication with OpenAI API
  - Manages function definitions and execution
  - Processes chat completions with function calling support

2. **WeatherService**
  - Integrates with OpenWeatherMap API
  - Provides fallback mock data for demo purposes
  - Extracts city names from user queries

### Components

1. **ChatComponent**
  - Main chat interface
  - Manages message history
  - Coordinates RAG and function calling
  - Handles user input and displays responses

### Key Features Implementation

**RAG Implementation:**
- Extracts location mentions from user queries
- Fetches real-time weather data
- Injects weather context into the AI prompt
- AI uses this context to provide accurate, current information

**Function Calling:**
- Defines functions in OpenAI-compatible schema
- AI determines when to call functions based on user intent
- Executes functions locally and returns results
- AI incorporates results into natural language responses

## Security Considerations

⚠️ **Important**: This demo app includes API keys in the frontend for simplicity. In production:

1. Never expose API keys in client-side code
2. Implement a backend proxy for API calls
3. Use environment variables and secure key management
4. Add rate limiting and authentication
5. Validate and sanitize all inputs

## Customization

### Adding New Functions
1. Define the function schema in `OpenAIService.functions`
2. Implement the function logic in `OpenAIService.executeFunction()`
3. Add appropriate UI elements if needed

### Adding New Data Sources (RAG)
1. Create a new service for your data source
2. Extract relevant information from user queries
3. Inject data into the message context
4. Update the system prompt to utilize the new data

## Troubleshooting

### Common Issues

1. **"API Key Invalid" Error**
  - Verify your OpenAI API key is correct
  - Ensure your API key has sufficient credits
  - Check API key permissions

2. **Weather Data Not Working**
  - The app will use mock data if the weather API fails
  - Verify your OpenWeatherMap API key
  - Check if the city name is being extracted correctly

3. **Functions Not Being Called**
  - Ensure functions are enabled (toggle switch)
  - Check the browser console for errors
  - Verify the function schema is correct

## License

This is a demonstration project. Please ensure you comply with OpenAI's and OpenWeatherMap's terms of service when using their APIs.
