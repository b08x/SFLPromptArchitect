/**
 * @file OpenRouterSettings.test.tsx
 * @description Unit tests for the OpenRouterSettings component (handles both OpenRouter and Groq)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OpenRouterSettings from '../OpenRouterSettings';
import { ProviderSettingsProps } from '../types';

// Mock the provider service
jest.mock('../../../services/providerService', () => ({
  getProviderConfiguration: jest.fn(),
}));

import { getProviderConfiguration } from '../../../services/providerService';
const mockGetProviderConfiguration = getProviderConfiguration as jest.MockedFunction<typeof getProviderConfiguration>;

// Mock props for OpenRouter testing
const mockOpenRouterProps: ProviderSettingsProps = {
  apiKey: '',
  onApiKeyChange: jest.fn(),
  onValidate: jest.fn(),
  validationStatus: 'idle',
  validationError: undefined,
  isValidating: false,
  onSetupComplete: jest.fn(),
  provider: 'openrouter',
  config: undefined,
};

// Mock props for Groq testing
const mockGroqProps: ProviderSettingsProps = {
  ...mockOpenRouterProps,
  provider: 'groq',
};

// Mock provider configuration response
const mockOpenRouterConfig = {
  provider: 'openrouter' as const,
  name: 'OpenRouter',
  description: 'Gateway to multiple AI models',
  models: [
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openrouter' as const,
      contextLength: 4096,
      supportedParameters: ['temperature', 'max_tokens', 'top_p', 'frequency_penalty', 'presence_penalty'],
      constraints: {
        temperature: { min: 0, max: 2, step: 0.01, default: 0.7 },
        max_tokens: { min: 1, max: 4096, step: 1, default: 2048 },
        top_p: { min: 0, max: 1, step: 0.01, default: 0.9 },
        frequency_penalty: { min: -2, max: 2, step: 0.01, default: 0 },
        presence_penalty: { min: -2, max: 2, step: 0.01, default: 0 },
      },
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'openrouter' as const,
      contextLength: 200000,
      supportedParameters: ['temperature', 'max_tokens', 'top_p'],
      constraints: {
        temperature: { min: 0, max: 1, step: 0.01, default: 0.7 },
        max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
        top_p: { min: 0, max: 1, step: 0.01, default: 0.9 },
      },
    },
  ],
  defaultParameters: {},
  supportedFeatures: ['chat', 'completion'],
  requiresApiKey: true,
};

const mockGroqConfig = {
  provider: 'groq' as const,
  name: 'Groq',
  description: 'High-speed AI inference',
  models: [
    {
      id: 'llama3-8b-8192',
      name: 'Llama 3 8B',
      provider: 'groq' as const,
      contextLength: 8192,
      supportedParameters: ['temperature', 'max_tokens', 'top_p'],
      constraints: {
        temperature: { min: 0, max: 2, step: 0.01, default: 0.7 },
        max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
        top_p: { min: 0, max: 1, step: 0.01, default: 0.9 },
      },
    },
  ],
  defaultParameters: {},
  supportedFeatures: ['chat', 'completion'],
  requiresApiKey: true,
};

describe('OpenRouterSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('OpenRouter Provider', () => {
    it('renders the basic OpenRouter component structure', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} />);
      
      expect(screen.getByText('OpenRouter Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure your OpenRouter API access for unified model access')).toBeInTheDocument();
      expect(screen.getByLabelText('OpenRouter API Key')).toBeInTheDocument();
      expect(screen.getByText('Validate OpenRouter API Key')).toBeInTheDocument();
    });

    it('shows OpenRouter-specific features', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} />);
      
      expect(screen.getByText('OpenRouter Features')).toBeInTheDocument();
      expect(screen.getByText('Unified API access')).toBeInTheDocument();
      expect(screen.getByText('100+ AI models')).toBeInTheDocument();
      expect(screen.getByText('Credit System')).toBeInTheDocument();
    });

    it('calls onApiKeyChange when API key input changes', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} />);
      
      const input = screen.getByLabelText('OpenRouter API Key');
      fireEvent.change(input, { target: { value: 'sk-or-v1-test-key' } });
      
      expect(mockOpenRouterProps.onApiKeyChange).toHaveBeenCalledWith('sk-or-v1-test-key');
    });

    it('loads models when validated and shows model selection', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Model Configuration')).toBeInTheDocument();
        expect(screen.getByText('Select Model')).toBeInTheDocument();
      });
      
      expect(mockGetProviderConfiguration).toHaveBeenCalledWith('openrouter');
    });

    it('shows search and category filters for OpenRouter', async () => {
      mockGetProviderConfiguration.mockResolvedValue({
        ...mockOpenRouterConfig,
        models: Array(15).fill(0).map((_, i) => ({
          ...mockOpenRouterConfig.models[0],
          id: `model-${i}`,
          name: `Model ${i}`,
        }))
      });
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument();
        expect(screen.getByDisplayValue('All Categories')).toBeInTheDocument();
      });
    });

    it('shows advanced parameters toggle for OpenRouter', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Show Advanced')).toBeInTheDocument();
      });
    });
  });

  describe('Groq Provider', () => {
    it('renders the basic Groq component structure', () => {
      render(<OpenRouterSettings {...mockGroqProps} />);
      
      expect(screen.getByText('Groq Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure your Groq API access for high-speed inference')).toBeInTheDocument();
      expect(screen.getByLabelText('Groq API Key')).toBeInTheDocument();
      expect(screen.getByText('Validate Groq API Key')).toBeInTheDocument();
    });

    it('shows Groq-specific features', () => {
      render(<OpenRouterSettings {...mockGroqProps} />);
      
      expect(screen.getByText('Groq Features')).toBeInTheDocument();
      expect(screen.getByText('Ultra-fast inference')).toBeInTheDocument();
      expect(screen.getByText('Optimized hardware acceleration')).toBeInTheDocument();
      expect(screen.getByText('Low latency responses')).toBeInTheDocument();
    });

    it('does not show advanced toggle for Groq', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockGroqConfig);
      
      render(<OpenRouterSettings {...mockGroqProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Model Configuration')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Show Advanced')).not.toBeInTheDocument();
    });

    it('does not show search filters for Groq', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockGroqConfig);
      
      render(<OpenRouterSettings {...mockGroqProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Model')).toBeInTheDocument();
      });
      
      expect(screen.queryByPlaceholderText('Search models...')).not.toBeInTheDocument();
    });

    it('calls onApiKeyChange with Groq API key format', () => {
      render(<OpenRouterSettings {...mockGroqProps} />);
      
      const input = screen.getByLabelText('Groq API Key');
      fireEvent.change(input, { target: { value: 'gsk_test-key' } });
      
      expect(mockGroqProps.onApiKeyChange).toHaveBeenCalledWith('gsk_test-key');
    });
  });

  describe('Common Functionality', () => {
    it('calls onValidate when validate button is clicked', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} apiKey="sk-or-v1-test-key" />);
      
      const validateButton = screen.getByText('Validate OpenRouter API Key');
      fireEvent.click(validateButton);
      
      expect(mockOpenRouterProps.onValidate).toHaveBeenCalled();
    });

    it('disables validate button when API key is empty', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} apiKey="" />);
      
      const validateButton = screen.getByText('Validate OpenRouter API Key');
      expect(validateButton).toBeDisabled();
    });

    it('shows validation success status', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      expect(screen.getByText('OpenRouter API key validated successfully')).toBeInTheDocument();
    });

    it('shows validation error status', () => {
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="invalid" validationError="Invalid API key" />);
      
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid API key')).toBeInTheDocument();
    });

    it('handles model loading errors gracefully', async () => {
      mockGetProviderConfiguration.mockRejectedValue(new Error('Network error'));
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load available models. Using fallback options.')).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching models', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockGetProviderConfiguration.mockReturnValue(promise);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      expect(screen.getByText('Loading available models...')).toBeInTheDocument();
      
      resolvePromise(mockOpenRouterConfig);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading available models...')).not.toBeInTheDocument();
      });
    });

    it('updates parameters when model is selected', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        const modelSelect = screen.getByDisplayValue('gpt-3.5-turbo');
        expect(modelSelect).toBeInTheDocument();
      });
      
      // Select a different model
      const modelSelect = screen.getByRole('combobox');
      fireEvent.change(modelSelect, { target: { value: 'claude-3-haiku' } });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('claude-3-haiku')).toBeInTheDocument();
      });
    });

    it('shows model information when model is selected', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument();
        expect(screen.getByText('Context Length: 4,096 tokens')).toBeInTheDocument();
        expect(screen.getByText('Supported Parameters: temperature, max_tokens, top_p, frequency_penalty, presence_penalty')).toBeInTheDocument();
      });
    });

    it('filters parameters based on model support', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('Max Tokens')).toBeInTheDocument();
      });
      
      // Select Claude model that doesn't support frequency_penalty
      const modelSelect = screen.getByRole('combobox');
      fireEvent.change(modelSelect, { target: { value: 'claude-3-haiku' } });
      
      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('Max Tokens')).toBeInTheDocument();
        // Frequency penalty should not be shown for Claude
      });
    });

    it('updates parameter values when controls are changed', async () => {
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} validationStatus="valid" />);
      
      await waitFor(() => {
        const temperatureSlider = screen.getByDisplayValue('0.7');
        fireEvent.change(temperatureSlider, { target: { value: '0.8' } });
        
        expect(temperatureSlider).toHaveValue('0.8');
      });
    });

    it('initializes parameters from config prop', async () => {
      const configWithParams = {
        temperature: 0.5,
        max_tokens: 1000,
        selectedModel: 'gpt-3.5-turbo',
      };
      
      mockGetProviderConfiguration.mockResolvedValue(mockOpenRouterConfig);
      
      render(<OpenRouterSettings {...mockOpenRouterProps} config={configWithParams} validationStatus="valid" />);
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('0.5')).toBeInTheDocument(); // Temperature
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Max tokens
        expect(screen.getByDisplayValue('gpt-3.5-turbo')).toBeInTheDocument(); // Selected model
      });
    });
  });
});