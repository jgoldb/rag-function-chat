import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { OpenAIService, Message } from '../services/openai.service';
import { WeatherService } from '../services/weather.service';
import { finalize } from 'rxjs/operators';

interface ChatMessage extends Message {
  timestamp: Date;
  isLoading?: boolean;
  metadata?: {
    functionCall?: string;
    ragData?: any;
  };
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: ChatMessage[] = [];
  inputControl = new FormControl('');
  isLoading = false;
  ragEnabled = true;
  functionsEnabled = true;

  // Speech recognition properties
  isListening = false;
  speechRecognition: any;
  speechSupported = false;
  interimTranscript = '';
  autoSendEnabled = true; // New property for auto-send toggle

  // Demo suggestions
  suggestions = [
    'What\'s the weather like in London?',
    'Calculate mortgage for $450,000 home with 20% down at 6.5% for 30 years',
    'What\'s my monthly payment for a $300k loan at 7.25% for 15 years? Include property tax of $3600/year',
    'Show me the first year amortization for a $250,000 mortgage at 5.75% for 30 years'
  ];

  constructor(
    private openaiService: OpenAIService,
    private weatherService: WeatherService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Add welcome message
    this.messages.push({
      role: 'assistant',
      content: 'Hello! I\'m a chat assistant with RAG (real-time weather data) and function calling capabilities. Try asking me about the weather in any city, or ask me to calculate compound interest or BMI!',
      timestamp: new Date()
    });

    // Initialize speech recognition
    this.initializeSpeechRecognition();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  private initializeSpeechRecognition() {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.speechSupported = true;
      this.speechRecognition = new SpeechRecognition();

      // Configure speech recognition
      this.speechRecognition.continuous = false; // Stops after detecting pause
      this.speechRecognition.interimResults = true;
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.maxAlternatives = 1;

      // Handle speech recognition results
      this.speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
        this.ngZone.run(() => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              this.interimTranscript = transcript;
            }
          }

          if (finalTranscript) {
            this.inputControl.setValue(finalTranscript);
            this.interimTranscript = '';

            // Auto-send if enabled and not currently loading
            if (this.autoSendEnabled && !this.isLoading) {
              // Small delay to show the final text before sending
              setTimeout(() => {
                this.ngZone.run(() => {
                  this.sendMessage();
                });
              }, 300);
            }
          }
        });
      };

      // Handle speech recognition end
      this.speechRecognition.onend = () => {
        this.ngZone.run(() => {
          this.isListening = false;
          this.interimTranscript = '';
        });
      };

      // Handle errors
      this.speechRecognition.onerror = (event: SpeechRecognitionError) => {
        this.ngZone.run(() => {
          console.error('Speech recognition error:', event.error);
          this.isListening = false;
          this.interimTranscript = '';

          if (event.error === 'no-speech') {
            // Silently stop - user didn't say anything
          } else if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please allow microphone access to use voice input.');
          } else {
            alert(`Speech recognition error: ${event.error}`);
          }
        });
      };

      // Handle no match
      this.speechRecognition.onnomatch = () => {
        this.ngZone.run(() => {
          this.isListening = false;
          this.interimTranscript = '';
        });
      };
    }
  }

  toggleDictation() {
    if (!this.speechSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    } else {
      this.speechRecognition.start();
      this.isListening = true;
      this.interimTranscript = '';
    }
  }

  async sendMessage() {
    const userInput = this.inputControl.value?.trim();
    if (!userInput || this.isLoading) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    this.messages.push(userMessage);
    this.inputControl.reset();
    this.isLoading = true;
    this.inputControl.disable();

    // Force immediate UI update
    this.cdr.detectChanges();

    // Prepare messages for API
    let apiMessages: Message[] = this.messages
      .filter(m => !m.isLoading)
      .map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
        function_call: m.function_call
      }));

    // RAG: Check if we need weather data
    let ragContext = '';
    if (this.ragEnabled) {
      const city = this.weatherService.extractCityFromMessage(userInput);
      if (city) {
        const weatherData = await this.weatherService.getWeatherData(city).toPromise();
        if (weatherData) {
          ragContext = `\n\nCurrent weather data: ${JSON.stringify(weatherData)}`;
          // Enhance the last user message with RAG context
          apiMessages[apiMessages.length - 1].content += ragContext;
        }
      }
    }

    // Add loading message
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };
    this.messages.push(loadingMessage);

    // Force immediate UI update for loading message
    this.cdr.detectChanges();

    // Send to OpenAI
    this.openaiService.sendMessage(apiMessages, this.ragEnabled, this.functionsEnabled)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.inputControl.enable();
        this.cdr.detectChanges(); // Force change detection
      }))
      .subscribe({
        next: async (response) => {
          // Remove loading message
          this.messages = this.messages.filter(m => !m.isLoading);

          const assistantMessage = response.choices[0].message;

          // Check if there's a function call
          if (assistantMessage.function_call && this.functionsEnabled) {
            // Add function call message
            this.messages.push({
              role: 'assistant',
              content: `Calling function: ${assistantMessage.function_call.name}`,
              timestamp: new Date(),
              metadata: {
                functionCall: assistantMessage.function_call.name
              }
            });

            // Execute function
            const functionArgs = JSON.parse(assistantMessage.function_call.arguments);
            const functionResult = this.openaiService.executeFunction(
              assistantMessage.function_call.name,
              functionArgs
            );

            // Add function result to messages
            const functionMessage: Message = {
              role: 'function',
              name: assistantMessage.function_call.name,
              content: functionResult
            };
            apiMessages.push(assistantMessage);
            apiMessages.push(functionMessage);

            // Get final response with function result
            this.openaiService.sendMessage(apiMessages, false, true).subscribe({
              next: (finalResponse) => {
                this.messages.push({
                  role: 'assistant',
                  content: finalResponse.choices[0].message.content,
                  timestamp: new Date()
                });
                this.cdr.detectChanges(); // Force change detection
              },
              error: (error) => {
                this.handleError(error);
              }
            });
          } else if (assistantMessage.function_call && !this.functionsEnabled) {
            // Function calling is disabled but AI tried to call a function
            // Request a text-only response
            const systemMessage: Message = {
              role: 'system',
              content: 'Please provide a direct answer without using any functions. Explain how to perform the calculation if needed.'
            };

            this.openaiService.sendMessage([systemMessage, ...apiMessages], false, false).subscribe({
              next: (retryResponse) => {
                this.messages.push({
                  role: 'assistant',
                  content: retryResponse.choices[0].message.content || 'I need to use functions to answer this question, but function calling is currently disabled. Please enable functions to get a precise calculation.',
                  timestamp: new Date()
                });
                this.cdr.detectChanges(); // Force change detection
              },
              error: (error) => {
                this.handleError(error);
              }
            });
          } else {
            // Regular response
            this.messages.push({
              role: 'assistant',
              content: assistantMessage.content || 'I apologize, but I couldn\'t generate a response. Please try again.',
              timestamp: new Date(),
              metadata: ragContext ? { ragData: ragContext } : undefined
            });
            this.cdr.detectChanges(); // Force change detection
          }
        },
        error: (error) => {
          this.handleError(error);
        }
      });
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    this.messages = this.messages.filter(m => !m.isLoading);
    this.messages.push({
      role: 'assistant',
      content: 'Sorry, I encountered an error. Please check your API key and try again.',
      timestamp: new Date()
    });
    this.inputControl.enable();
  }

  useSuggestion(suggestion: string) {
    this.inputControl.setValue(suggestion);
    this.sendMessage();
  }

  clearChat() {
    this.messages = [{
      role: 'assistant',
      content: 'Chat cleared. How can I help you today?',
      timestamp: new Date()
    }];
  }
}
