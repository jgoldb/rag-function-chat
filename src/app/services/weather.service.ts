import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {environment} from "../../environments/environment";

export interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  // Using OpenWeatherMap API (free tier available)
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private apiKey = environment.openWeatherApiKey || 'YOUR_OPENWEATHER_API_KEY'; // Replace with your API key

  constructor(private http: HttpClient) {}

  getWeatherData(city: string): Observable<WeatherData | null> {
    const url = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;

    return this.http.get<any>(url).pipe(
      map(response => ({
        location: response.name,
        temperature: response.main.temp,
        description: response.weather[0].description,
        humidity: response.main.humidity,
        windSpeed: response.wind.speed,
        timestamp: new Date()
      })),
      catchError(error => {
        console.error('Weather API error:', error);
        // Return mock data for demo purposes if API fails
        return of(this.getMockWeatherData(city));
      })
    );
  }

  // Mock data for demo purposes when API key is not set
  private getMockWeatherData(city: string): WeatherData {
    const mockData: { [key: string]: WeatherData } = {
      'London': {
        location: 'London',
        temperature: 15,
        description: 'partly cloudy',
        humidity: 65,
        windSpeed: 5.2,
        timestamp: new Date()
      },
      'New York': {
        location: 'New York',
        temperature: 22,
        description: 'clear sky',
        humidity: 55,
        windSpeed: 3.8,
        timestamp: new Date()
      },
      'Tokyo': {
        location: 'Tokyo',
        temperature: 18,
        description: 'light rain',
        humidity: 75,
        windSpeed: 4.5,
        timestamp: new Date()
      }
    };

    return mockData[city] || {
      location: city,
      temperature: 20,
      description: 'sunny',
      humidity: 60,
      windSpeed: 4.0,
      timestamp: new Date()
    };
  }

  // Extract city names from user input for RAG
  extractCityFromMessage(message: string): string | null {
    // Simple extraction - can be enhanced with NLP
    const commonCities = [
      'London', 'New York', 'Tokyo', 'Paris', 'Berlin',
      'Sydney', 'Toronto', 'Mumbai', 'Beijing', 'Moscow',
      'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'
    ];

    const messageLower = message.toLowerCase();
    for (const city of commonCities) {
      if (messageLower.includes(city.toLowerCase())) {
        return city;
      }
    }

    // Try to extract "weather in [city]" pattern
    const weatherPattern = /weather\s+(?:in|for|at)\s+([a-zA-Z\s]+)/i;
    const match = message.match(weatherPattern);
    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }
}
