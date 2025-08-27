/**
 * @file OllamaSettings.test.tsx
 * @description Comprehensive tests for the Ollama provider settings component.
 * Tests connection management, model discovery, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';
import OllamaSettings from '../OllamaSettings';
import { ProviderSettingsProps } from '../types';
import * as sessionCacheServiceModule from '../../../../services/sessionCacheService';

// Mock the session cache service
const mockSessionCacheService = {
  saveSessionSettings: jest.fn().mockResolvedValue({ success: true, data: null }),
  loadSessionSettings: jest.fn().mockReturnValue({ success: true, data: null }),
  clearSessionCache: jest.fn().mockReturnValue({ success: true, data: null }),
  hasCachedSettings: jest.fn().mockReturnValue(false),
  getCacheInfo: jest.fn().mockReturnValue({ isSupported: true, hasCachedData: false }),
  updateCachedParameters: jest.fn().mockResolvedValue({ success: true, data: null })
};

// Mock the custom hook
jest.mock('../../../../hooks/useOllamaConnection', () => ({
  useOllamaConnection: jest.fn(() => ({
    connectionStatus: 'disconnected',
    availableModels: [],
    isLoadingModels: false,
    connectionError: '',
    lastConnectionTest: 0,
    testConnection: jest.fn().mockResolvedValue(true),
    fetchAvailableModels: jest.fn().mockResolvedValue([]),
    resetConnection: jest.fn()
  }))
}));

// Mock session cache service
jest.mock('../../../../services/sessionCacheService', () => ({
  sessionCacheService: mockSessionCacheService
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('OllamaSettings', () => {
  const defaultProps: ProviderSettingsProps = {
    apiKey: 'http://localhost:11434',
    onApiKeyChange: jest.fn(),
    onValidate: jest.fn(),
    validationStatus: 'idle',
    validationError: undefined,
    isValidating: false,
    onSetupComplete: jest.fn(),
    provider: 'ollama',
    config: undefined
  };

  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the component with default values', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('Ollama Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Ollama Server URL')).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://localhost:11434')).toBeInTheDocument();
  });

  it('displays connection status indicator', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('shows Ollama features information', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('Ollama Features')).toBeInTheDocument();
    expect(screen.getByText('Local deployment')).toBeInTheDocument();
    expect(screen.getByText('Complete privacy')).toBeInTheDocument();
    expect(screen.getByText('No internet required')).toBeInTheDocument();
    expect(screen.getByText('Custom model support')).toBeInTheDocument();
  });

  it('displays installation guide', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('Getting Started with Ollama')).toBeInTheDocument();
    expect(screen.getByText(/Install Ollama:/)).toBeInTheDocument();
    expect(screen.getByText(/Pull a model:/)).toBeInTheDocument();
    expect(screen.getByText(/Start the server:/)).toBeInTheDocument();
  });

  it('shows popular models information', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('Popular Ollama Models')).toBeInTheDocument();
    expect(screen.getByText(/Llama 2:/)).toBeInTheDocument();
    expect(screen.getByText(/Code Llama:/)).toBeInTheDocument();
    expect(screen.getByText(/Mistral:/)).toBeInTheDocument();
    expect(screen.getByText(/Vicuna:/)).toBeInTheDocument();
  });

  it('displays system requirements', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    expect(screen.getByText('System Requirements')).toBeInTheDocument();
    expect(screen.getByText(/Ensure adequate RAM and storage/)).toBeInTheDocument();
  });

  it('handles base URL changes', async () => {
    const onApiKeyChange = jest.fn();
    render(<OllamaSettings {...defaultProps} onApiKeyChange={onApiKeyChange} />);
    
    const urlInput = screen.getByLabelText('Ollama Server URL');
    
    await user.clear(urlInput);
    await user.type(urlInput, 'http://localhost:11435');
    
    expect(onApiKeyChange).toHaveBeenLastCalledWith('http://localhost:11435');
  });

  it('shows validation button and handles click', async () => {
    const onValidate = jest.fn();
    render(<OllamaSettings {...defaultProps} onValidate={onValidate} />);
    
    const validateButton = screen.getByText('Test Ollama Connection');
    expect(validateButton).toBeInTheDocument();
    
    await user.click(validateButton);
    
    expect(onValidate).toHaveBeenCalled();
  });

  it('disables validation button when base URL is empty', () => {
    render(<OllamaSettings {...defaultProps} apiKey="" />);
    
    const validateButton = screen.getByText('Test Ollama Connection');
    expect(validateButton).toBeDisabled();
  });

  it('shows validation success status', () => {
    render(<OllamaSettings {...defaultProps} validationStatus="valid" />);
    
    expect(screen.getByText('Ollama server connection successful')).toBeInTheDocument();
  });

  it('shows validation error status', () => {
    const validationError = 'Connection failed: Network error';
    render(<OllamaSettings {...defaultProps} validationStatus="invalid" validationError={validationError} />);
    
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
    expect(screen.getByText(validationError)).toBeInTheDocument();
  });

  it('shows loading state during validation', () => {
    render(<OllamaSettings {...defaultProps} isValidating={true} />);
    
    expect(screen.getByText('Testing Connection...')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Testing Connection/ });
    expect(button).toBeDisabled();
  });

  it('initializes from config when provided', () => {
    const config = {
      baseURL: 'http://custom:11434',
      selectedModel: 'llama2:7b'
    };
    
    render(<OllamaSettings {...defaultProps} config={config} />);
    
    const urlInput = screen.getByLabelText('Ollama Server URL');
    expect(urlInput).toHaveValue('http://custom:11434');
  });

  it('provides connection test button in URL input', () => {
    render(<OllamaSettings {...defaultProps} />);
    
    const testButton = screen.getByTitle('Test connection');
    expect(testButton).toBeInTheDocument();
  });

  describe('Connected state', () => {
    const mockUseOllamaConnection = require('../../../../hooks/useOllamaConnection').useOllamaConnection;

    beforeEach(() => {
      mockUseOllamaConnection.mockReturnValue({
        connectionStatus: 'connected',
        availableModels: [
          { name: 'llama2:7b', size: 3800000000, model: 'llama2:7b' },
          { name: 'mistral:7b', size: 4100000000, model: 'mistral:7b' }
        ],
        isLoadingModels: false,
        connectionError: '',
        lastConnectionTest: Date.now() - 5000,
        testConnection: jest.fn().mockResolvedValue(true),
        fetchAvailableModels: jest.fn().mockResolvedValue([]),
        resetConnection: jest.fn()
      });
    });

    it('shows model selection when connected', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByLabelText('Available Models')).toBeInTheDocument();
      expect(screen.getByDisplayValue('llama2:7b (3.5GB)')).toBeInTheDocument();
    });

    it('shows refresh models button when connected', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByText('Refresh Models')).toBeInTheDocument();
    });

    it('shows connected status with model count', () => {
      render(<OllamaSettings {...defaultProps} validationStatus="valid" />);
      
      expect(screen.getByText('Ollama server connection successful')).toBeInTheDocument();
      expect(screen.getByText('Found 2 models')).toBeInTheDocument();
      expect(screen.getByText(/(tested \d+s ago)/)).toBeInTheDocument();
    });

    it('shows selected model details', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByText(/Selected model:/)).toBeInTheDocument();
      expect(screen.getByText('llama2:7b')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    const mockUseOllamaConnection = require('../../../../hooks/useOllamaConnection').useOllamaConnection;

    beforeEach(() => {
      mockUseOllamaConnection.mockReturnValue({
        connectionStatus: 'connected',
        availableModels: [],
        isLoadingModels: true,
        connectionError: '',
        lastConnectionTest: 0,
        testConnection: jest.fn().mockResolvedValue(true),
        fetchAvailableModels: jest.fn().mockResolvedValue([]),
        resetConnection: jest.fn()
      });
    });

    it('shows loading spinner in model dropdown', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      const modelSelect = screen.getByLabelText('Available Models');
      expect(modelSelect).toBeDisabled();
      
      // Check for loading spinner (by class or animation)
      const loadingIndicator = screen.getByRole('generic');
      expect(loadingIndicator).toHaveClass('animate-spin');
    });
  });

  describe('Error state', () => {
    const mockUseOllamaConnection = require('../../../../hooks/useOllamaConnection').useOllamaConnection;

    beforeEach(() => {
      mockUseOllamaConnection.mockReturnValue({
        connectionStatus: 'error',
        availableModels: [],
        isLoadingModels: false,
        connectionError: 'Connection failed: ECONNREFUSED',
        lastConnectionTest: 0,
        testConnection: jest.fn().mockResolvedValue(false),
        fetchAvailableModels: jest.fn().mockRejectedValue(new Error('Connection failed')),
        resetConnection: jest.fn()
      });
    });

    it('shows connection error message', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText('Connection failed: ECONNREFUSED')).toBeInTheDocument();
    });

    it('shows disconnected status indicator', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for form controls', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByLabelText('Ollama Server URL')).toBeInTheDocument();
    });

    it('has keyboard navigation support', async () => {
      render(<OllamaSettings {...defaultProps} />);
      
      const urlInput = screen.getByLabelText('Ollama Server URL');
      const validateButton = screen.getByText('Test Ollama Connection');
      
      await user.tab();
      expect(urlInput).toHaveFocus();
      
      await user.tab();
      await user.tab(); // Skip the connection test button
      expect(validateButton).toHaveFocus();
    });

    it('provides helpful tooltips and descriptions', () => {
      render(<OllamaSettings {...defaultProps} />);
      
      expect(screen.getByText(/Default Ollama server runs on port 11434/)).toBeInTheDocument();
      expect(screen.getByTitle('Test connection')).toBeInTheDocument();
    });
  });
});