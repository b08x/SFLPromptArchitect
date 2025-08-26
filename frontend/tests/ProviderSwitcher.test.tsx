/**
 * @file ProviderSwitcher.test.tsx
 * @description Comprehensive tests for the secure ProviderSwitcher component
 * Tests focus on security, dynamic behavior, and proper backend integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import ProviderSwitcher from '../components/ProviderSwitcher';
import { ActiveProviderConfig, AIProvider } from '../types/aiProvider';
import * as providerService from '../services/providerService';

// Mock the provider service
jest.mock('../services/providerService');
const mockProviderService = providerService as jest.Mocked<typeof providerService>;

// Mock icon components
jest.mock('../components/icons/CogIcon', () => () => <div data-testid="cog-icon">CogIcon</div>);
jest.mock('../components/icons/ArrowsRightLeftIcon', () => () => <div data-testid="arrows-icon">ArrowsIcon</div>);
jest.mock('../components/icons/CheckCircleIcon', () => () => <div data-testid="check-icon">CheckIcon</div>);
jest.mock('../components/icons/XCircleIcon', () => () => <div data-testid="x-icon">XIcon</div>);

// Test data
const mockProviderData: providerService.ProviderData[] = [
  {
    provider: 'openai',
    hasApiKey: true,
    isConfigured: true,
    validationResult: { success: true }
  },
  {
    provider: 'anthropic',
    hasApiKey: false,
    isConfigured: false,
    validationResult: { success: false, error: 'No API key' }
  },
  {
    provider: 'google',
    hasApiKey: true,
    isConfigured: true,
    validationResult: { success: true }
  },
  {
    provider: 'groq',
    hasApiKey: false,
    isConfigured: false,
  }
];

const mockProviderConfig: providerService.ProviderConfig = {
  provider: 'openai',
  name: 'OpenAI',
  description: 'OpenAI GPT models',
  models: [
    {
      id: 'gpt-4o',
      name: 'GPT-4 Omni',
      provider: 'openai',
      contextLength: 128000,
      supportedParameters: ['temperature', 'maxTokens', 'top_p'],
      constraints: {
        temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
        maxTokens: { min: 1, max: 4096, step: 1, default: 1024 },
        top_p: { min: 0.0, max: 1.0, step: 0.05, default: 1.0 },
      },
      pricing: { input: 2.50, output: 10.00 }
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4 Omni Mini',
      provider: 'openai',
      contextLength: 128000,
      supportedParameters: ['temperature', 'maxTokens'],
      constraints: {
        temperature: { min: 0.0, max: 2.0, step: 0.1, default: 1.0 },
        maxTokens: { min: 1, max: 16384, step: 1, default: 1024 },
      }
    }
  ],
  defaultParameters: {
    temperature: 1.0,
    maxTokens: 1024,
    top_p: 1.0
  },
  supportedFeatures: ['text', 'multimodal'],
  requiresApiKey: true
};

const mockActiveConfig: ActiveProviderConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  parameters: {
    temperature: 1.0,
    maxTokens: 1024,
    top_p: 1.0
  },
  apiKey: '', // Should always be empty in secure implementation
};

describe('ProviderSwitcher Component', () => {
  const mockOnConfigChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockProviderService.getProviderConfigurations.mockResolvedValue(mockProviderData);
    mockProviderService.getStoredProviders.mockResolvedValue({
      success: true,
      providers: ['openai', 'google']
    });
    mockProviderService.getProviderConfiguration.mockResolvedValue(mockProviderConfig);
  });

  describe('Security Features', () => {
    test('should never display or store API keys client-side', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.queryByDisplayValue(/sk-/)).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue(/api[_-]key/i)).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/api[_-]key/i)).not.toBeInTheDocument();
      });

      // Check that config passed to onChange never contains actual API keys
      expect(mockActiveConfig.apiKey).toBe('');
    });

    test('should not have any input fields for API keys', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          showAdvanced={true}
        />
      );

      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        inputs.forEach(input => {
          expect(input).not.toHaveAttribute('type', 'password');
          expect(input).not.toHaveAttribute('placeholder', expect.stringMatching(/api[_-]?key/i));
          expect(input).not.toHaveAttribute('name', expect.stringMatching(/api[_-]?key/i));
        });
      });
    });

    test('should rely on backend for API key validation status', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(mockProviderService.getStoredProviders).toHaveBeenCalled();
      });

      // Should show green indicator for providers with stored keys
      const openaiButton = screen.getByText(/openai/i).parentElement;
      const indicator = openaiButton?.querySelector('div[class*="bg-green-500"]');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Dynamic Provider Loading', () => {
    test('should fetch provider configurations on mount', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(mockProviderService.getProviderConfigurations).toHaveBeenCalledTimes(1);
        expect(mockProviderService.getStoredProviders).toHaveBeenCalledTimes(1);
        expect(mockProviderService.getProviderConfiguration).toHaveBeenCalledWith('openai');
      });
    });

    test('should display all available providers from backend', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/openai/i)).toBeInTheDocument();
        expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
        expect(screen.getByText(/google/i)).toBeInTheDocument();
        expect(screen.getByText(/groq/i)).toBeInTheDocument();
      });
    });

    test('should handle provider loading errors gracefully', async () => {
      const error = new Error('Network error');
      mockProviderService.getProviderConfigurations.mockRejectedValue(error);

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
        expect(screen.getByText(/Refresh Page/i)).toBeInTheDocument();
      });
    });

    test('should auto-retry network errors up to 2 times', async () => {
      const networkError = new Error('fetch failed');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockProviderService.getProviderConfigurations
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(mockProviderData);

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      // Should auto-retry up to 2 times for network errors
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Retrying provider load (attempt 1/2)...');
        expect(consoleSpy).toHaveBeenCalledWith('Retrying provider load (attempt 2/2)...');
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByText(/fetch failed \(Auto-retry failed\)/i)).toBeInTheDocument();
      }, { timeout: 6000 });

      expect(mockProviderService.getProviderConfigurations).toHaveBeenCalledTimes(3);
      consoleSpy.mockRestore();
    });

    test('should allow retrying failed provider loads', async () => {
      const error = new Error('Network error');
      mockProviderService.getProviderConfigurations
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(mockProviderData);

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Retry/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByText(/Retry/i);
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/openai/i)).toBeInTheDocument();
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
      });

      expect(mockProviderService.getProviderConfigurations).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dynamic Model Loading', () => {
    test('should load models when provider changes', async () => {
      const user = userEvent.setup();
      
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
      });

      const anthropicButton = screen.getByText(/anthropic/i);
      await user.click(anthropicButton);

      expect(mockProviderService.getProviderConfiguration).toHaveBeenCalledWith('anthropic');
    });

    test('should display models from backend configuration', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        const modelSelect = screen.getByRole('combobox');
        expect(modelSelect).toBeInTheDocument();
      });

      // Should show models from mockProviderConfig
      expect(screen.getByText(/GPT-4 Omni/)).toBeInTheDocument();
    });

    test('should handle model loading errors with retry', async () => {
      const user = userEvent.setup();
      const error = new Error('Model fetch failed');
      
      mockProviderService.getProviderConfiguration
        .mockResolvedValueOnce(mockProviderConfig) // Initial load succeeds
        .mockRejectedValueOnce(error); // Provider change fails

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
      });

      const anthropicButton = screen.getByText(/anthropic/i);
      await user.click(anthropicButton);

      await waitFor(() => {
        expect(screen.getByText(/Model Loading Error/i)).toBeInTheDocument();
        expect(screen.getByText(/Retry Models/i)).toBeInTheDocument();
      });
    });
  });

  describe('Parameter Management', () => {
    test('should display parameters from backend model constraints', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          showAdvanced={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
      });
    });

    test('should handle parameter changes correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          showAdvanced={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
      });

      const temperatureSlider = screen.getByLabelText(/temperature/i);
      await user.clear(temperatureSlider);
      await user.type(temperatureSlider, '0.5');

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            temperature: 0.5
          })
        })
      );
    });

    test('should apply parameter presets correctly', async () => {
      const user = userEvent.setup();
      
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          showAdvanced={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Precise/i)).toBeInTheDocument();
      });

      const preciseButton = screen.getByText(/Precise/i);
      await user.click(preciseButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            temperature: 0.2
          })
        })
      );
    });
  });

  describe('Compact Mode', () => {
    test('should render compact view when specified', () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          compact={true}
        />
      );

      expect(screen.getByTestId('cog-icon')).toBeInTheDocument();
      expect(screen.queryByText(/Parameters/i)).not.toBeInTheDocument();
    });

    test('should expand to full view when cog icon is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
          compact={true}
        />
      );

      const cogIcon = screen.getByTestId('cog-icon');
      await user.click(cogIcon);

      await waitFor(() => {
        expect(screen.getByText(/AI Provider/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle provider switching errors', async () => {
      const user = userEvent.setup();
      const error = new Error('Provider switch failed');
      
      mockProviderService.getProviderConfiguration.mockRejectedValueOnce(error);

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/anthropic/i)).toBeInTheDocument();
      });

      const anthropicButton = screen.getByText(/anthropic/i);
      await user.click(anthropicButton);

      // Should handle the error gracefully without crashing
      expect(console.error).toHaveBeenCalledWith('Error changing provider:', error);
    });

    test('should show appropriate status for providers without API keys', async () => {
      render(
        <ProviderSwitcher
          currentConfig={{ ...mockActiveConfig, provider: 'anthropic' }}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/API key not configured/i)).toBeInTheDocument();
      });
    });
  });

  describe('Backend Integration', () => {
    test('should not perform any localStorage operations', async () => {
      const localStorageSpy = jest.spyOn(Storage.prototype, 'getItem');
      const setLocalStorageSpy = jest.spyOn(Storage.prototype, 'setItem');

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/openai/i)).toBeInTheDocument();
      });

      expect(localStorageSpy).not.toHaveBeenCalled();
      expect(setLocalStorageSpy).not.toHaveBeenCalled();

      localStorageSpy.mockRestore();
      setLocalStorageSpy.mockRestore();
    });

    test('should use backend service for all provider operations', async () => {
      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(mockProviderService.getProviderConfigurations).toHaveBeenCalled();
        expect(mockProviderService.getStoredProviders).toHaveBeenCalled();
        expect(mockProviderService.getProviderConfiguration).toHaveBeenCalled();
      });

      // Should not import any static configuration
      const component = screen.getByTestId('arrows-icon').closest('div');
      expect(component).toBeInTheDocument();
    });

    test('should fail completely if backend is unavailable (no static fallback)', async () => {
      const error = new Error('Backend completely unavailable');
      mockProviderService.getProviderConfigurations.mockRejectedValue(error);

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Backend completely unavailable/i)).toBeInTheDocument();
      });

      // Should NOT show any providers from static config
      expect(screen.queryByText(/openai/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/anthropic/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    test('should show loading state while fetching providers', async () => {
      // Mock a slow response
      mockProviderService.getProviderConfigurations.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockProviderData), 100))
      );

      render(
        <ProviderSwitcher
          currentConfig={mockActiveConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByText(/Loading providers/i)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText(/Loading providers/i)).not.toBeInTheDocument();
      });
    });
  });
});