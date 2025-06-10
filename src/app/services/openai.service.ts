import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  functions?: any[];
  function_call?: 'auto' | 'none' | { name: string };
  temperature?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OpenAIService {
  private apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  // Define available functions for OpenAI
  private functions = [
    {
      name: 'calculate_compound_interest',
      description: 'Calculate compound interest for an investment',
      parameters: {
        type: 'object',
        properties: {
          principal: {
            type: 'number',
            description: 'The initial investment amount'
          },
          rate: {
            type: 'number',
            description: 'Annual interest rate (e.g., 5 for 5% or 0.05 for 5%)'
          },
          time: {
            type: 'number',
            description: 'Investment period in years'
          },
          compound_frequency: {
            type: 'number',
            description: 'Number of times interest is compounded per year',
            default: 1
          }
        },
        required: ['principal', 'rate', 'time']
      }
    },
    {
      name: 'calculate_bmi',
      description: 'Calculate Body Mass Index (BMI)',
      parameters: {
        type: 'object',
        properties: {
          weight: {
            type: 'number',
            description: 'Weight in kilograms'
          },
          height: {
            type: 'number',
            description: 'Height in meters'
          },
          unit_system: {
            type: 'string',
            enum: ['metric', 'imperial'],
            description: 'Unit system for input values',
            default: 'metric'
          }
        },
        required: ['weight', 'height']
      }
    },
    {
      name: 'calculate_mortgage',
      description: 'Calculate detailed mortgage payment information including monthly payment, total interest, and amortization schedule',
      parameters: {
        type: 'object',
        properties: {
          loan_amount: {
            type: 'number',
            description: 'The total home price or loan amount before down payment'
          },
          annual_rate: {
            type: 'number',
            description: 'Annual interest rate (e.g., 6.5 for 6.5% or 0.065 for 6.5%)'
          },
          loan_term_years: {
            type: 'number',
            description: 'Loan term in years (typically 15 or 30)'
          },
          down_payment: {
            type: 'number',
            description: 'Down payment amount (not percentage)',
            default: 0
          },
          property_tax_annual: {
            type: 'number',
            description: 'Annual property tax amount',
            default: 0
          },
          insurance_annual: {
            type: 'number',
            description: 'Annual home insurance amount',
            default: 0
          },
          show_amortization: {
            type: 'boolean',
            description: 'Whether to include first year amortization schedule',
            default: false
          }
        },
        required: ['loan_amount', 'annual_rate', 'loan_term_years']
      }
    }
  ];

  sendMessage(messages: Message[], includeRAG: boolean = false, includeFunctions: boolean = true): Observable<any> {
    const headers = {
      'Authorization': `Bearer ${environment.openaiApiKey}`,
      'Content-Type': 'application/json'
    };

    // Add system message for RAG if enabled
    let allMessages = [...messages];
    if (includeRAG && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        // This will be enhanced with actual RAG context in the component
        allMessages = [
          {
            role: 'system',
            content: 'You are a helpful assistant. When asked about weather or current conditions, use the provided real-time data to give accurate information.'
          },
          ...messages
        ];
      }
    }

    const body: ChatCompletionRequest = {
      model: 'gpt-4-turbo-preview',
      messages: allMessages,
      functions: includeFunctions ? this.functions : undefined,
      function_call: includeFunctions ? 'auto' : undefined,
      temperature: 0.7
    };

    return this.http.post(this.apiUrl, body, { headers });
  }

  // Execute function calls
  executeFunction(name: string, args: any): string {
    switch (name) {
      case 'calculate_compound_interest':
        return this.calculateCompoundInterest(args);
      case 'calculate_bmi':
        return this.calculateBMI(args);
      case 'calculate_mortgage':
        return this.calculateMortgage(args);
      default:
        return JSON.stringify({ error: 'Function not found' });
    }
  }

  private calculateCompoundInterest(args: any): string {
    let { principal, rate, time, compound_frequency = 1 } = args;

    // Normalize the rate - if it's greater than 1, assume it's a percentage
    if (rate > 1) {
      rate = rate / 100;
    }

    const amount = principal * Math.pow((1 + rate / compound_frequency), compound_frequency * time);
    const interest = amount - principal;

    return JSON.stringify({
      principal: principal,
      rate: (rate * 100).toFixed(2) + '%',
      time: time,
      compound_frequency: compound_frequency,
      final_amount: amount.toFixed(2),
      total_interest: interest.toFixed(2)
    });
  }

  private calculateBMI(args: any): string {
    let { weight, height, unit_system = 'metric' } = args;

    // Convert to metric if needed
    if (unit_system === 'imperial') {
      weight = weight * 0.453592; // pounds to kg
      height = height * 0.0254; // inches to meters
    }

    const bmi = weight / (height * height);
    let category = '';

    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    return JSON.stringify({
      bmi: bmi.toFixed(1),
      category: category,
      weight: weight.toFixed(1),
      height: height.toFixed(2)
    });
  }

  private calculateMortgage(args: any): string {
    let {
      loan_amount,
      annual_rate,
      loan_term_years,
      down_payment = 0,
      property_tax_annual = 0,
      insurance_annual = 0,
      show_amortization = false
    } = args;

    // Normalize the annual rate - if it's greater than 1, assume it's a percentage
    if (annual_rate > 1) {
      annual_rate = annual_rate / 100;
    }

    // Validate inputs
    loan_amount = Math.abs(loan_amount);
    down_payment = Math.abs(down_payment);
    loan_term_years = Math.abs(loan_term_years);

    const principal = loan_amount - down_payment;
    const monthly_rate = annual_rate / 12;
    const num_payments = loan_term_years * 12;

    // Calculate monthly payment using mortgage formula
    const monthly_payment = principal *
      (monthly_rate * Math.pow(1 + monthly_rate, num_payments)) /
      (Math.pow(1 + monthly_rate, num_payments) - 1);

    // Calculate additional monthly costs
    const monthly_property_tax = property_tax_annual / 12;
    const monthly_insurance = insurance_annual / 12;
    const total_monthly_payment = monthly_payment + monthly_property_tax + monthly_insurance;

    // Calculate totals
    const total_paid = monthly_payment * num_payments;
    const total_interest = total_paid - principal;

    // Calculate amortization for first year if requested
    let amortization_schedule = [];
    if (show_amortization) {
      let remaining_balance = principal;
      for (let month = 1; month <= 12; month++) {
        const interest_payment = remaining_balance * monthly_rate;
        const principal_payment = monthly_payment - interest_payment;
        remaining_balance -= principal_payment;

        amortization_schedule.push({
          month: month,
          principal_payment: principal_payment.toFixed(2),
          interest_payment: interest_payment.toFixed(2),
          remaining_balance: remaining_balance.toFixed(2)
        });
      }
    }

    // Calculate some useful metrics
    const total_cost = total_paid + (property_tax_annual * loan_term_years) + (insurance_annual * loan_term_years);
    const interest_percentage = (total_interest / principal) * 100;

    return JSON.stringify({
      loan_amount: loan_amount,
      down_payment: down_payment,
      principal: principal.toFixed(2),
      annual_rate: (annual_rate * 100).toFixed(3) + '%',
      loan_term_years: loan_term_years,
      monthly_payment_principal_interest: monthly_payment.toFixed(2),
      monthly_property_tax: monthly_property_tax.toFixed(2),
      monthly_insurance: monthly_insurance.toFixed(2),
      total_monthly_payment: total_monthly_payment.toFixed(2),
      total_payments: num_payments,
      total_paid: total_paid.toFixed(2),
      total_interest: total_interest.toFixed(2),
      interest_percentage: interest_percentage.toFixed(1) + '%',
      total_cost_with_taxes_insurance: total_cost.toFixed(2),
      first_year_amortization: amortization_schedule,
      calculation_details: {
        normalized_rate: annual_rate,
        monthly_rate: monthly_rate.toFixed(6),
        principal_calculated: principal
      }
    });
  }
}
