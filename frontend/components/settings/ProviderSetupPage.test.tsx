/**
 * @file ProviderSetupPage.test.tsx
 * @description Unit tests for the ProviderSetupPage component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProviderSetupPage from './ProviderSetupPage';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('ProviderSetupPage', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    render(<ProviderSetupPage />);
  });

  describe('Rendering', () => {
    test('renders the main title', () => {
      expect(screen.getByText('AI Provider Configuration')).toBeInTheDocument();
    });

    test('renders provider selection section', () => {
      expect(screen.getByText('Select AI Provider')).toBeInTheDocument();
      expect(screen.getByText('Choose your preferred AI provider to configure API access.')).toBeInTheDocument();
    });

    test('renders all three provider options', () => {
      expect(screen.getByText('Google Gemini')).toBeInTheDocument();
      expect(screen.getByText('OpenAI')).toBeInTheDocument();
      expect(screen.getByText('OpenRouter')).toBeInTheDocument();
    });

    test('renders API key configuration section', () => {
      expect(screen.getByText('API Key Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
      expect(screen.getByText('Validate API Key')).toBeInTheDocument();
    });

    test('renders getting started information', () => {
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('Google provider is selected by default', () => {
      const googleRadio = screen.getByDisplayValue('google');
      expect(googleRadio).toBeChecked();
    });

    test('can select different providers', () => {
      const openaiRadio = screen.getByDisplayValue('openai');
      const openrouterRadio = screen.getByDisplayValue('openrouter');
      
      fireEvent.click(openaiRadio);
      expect(openaiRadio).toBeChecked();
      
      fireEvent.click(openrouterRadio);
      expect(openrouterRadio).toBeChecked();
    });

    test('API key input accepts text', () => {
      const apiKeyInput = screen.getByLabelText('API Key');
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
      expect(apiKeyInput).toHaveValue('test-api-key');
    });

    test('validate button is clickable', () => {
      const validateButton = screen.getByText('Validate API Key');
      expect(validateButton).toBeEnabled();
      fireEvent.click(validateButton);
      // Note: In future iterations, this will trigger validation logic
    });
  });

  describe('Accessibility', () => {
    test('has proper form labels', () => {
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
    });

    test('radio buttons have proper names', () => {
      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach(radio => {
        expect(radio).toHaveAttribute('name', 'provider');
      });
    });

    test('form elements have proper ARIA attributes', () => {
      const apiKeyInput = screen.getByLabelText('API Key');
      expect(apiKeyInput).toHaveAttribute('type', 'password');
    });
  });

  describe('State Management', () => {
    test('initializes with default state values', () => {
      const googleRadio = screen.getByDisplayValue('google');
      const apiKeyInput = screen.getByLabelText('API Key');
      
      expect(googleRadio).toBeChecked();
      expect(apiKeyInput).toHaveValue('');
    });

    test('updates state when provider selection changes', () => {
      const openaiRadio = screen.getByDisplayValue('openai');
      const googleRadio = screen.getByDisplayValue('google');
      
      fireEvent.click(openaiRadio);
      expect(openaiRadio).toBeChecked();
      expect(googleRadio).not.toBeChecked();
      
      fireEvent.click(googleRadio);
      expect(googleRadio).toBeChecked();
      expect(openaiRadio).not.toBeChecked();
    });

    test('updates state when API key input changes', () => {
      const apiKeyInput = screen.getByLabelText('API Key');
      
      fireEvent.change(apiKeyInput, { target: { value: 'test-key-123' } });
      expect(apiKeyInput).toHaveValue('test-key-123');
      
      fireEvent.change(apiKeyInput, { target: { value: 'updated-key-456' } });
      expect(apiKeyInput).toHaveValue('updated-key-456');
    });
  });

  describe('LocalStorage Integration', () => {
    test('attempts to load settings from localStorage on mount', () => {
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sfl-ai-provider');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sfl-api-key');
    });

    test('saves provider to localStorage when changed', async () => {
      const openaiRadio = screen.getByDisplayValue('openai');
      
      fireEvent.click(openaiRadio);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sfl-ai-provider', 'openai');
      });
    });

    test('saves API key to localStorage when changed', async () => {
      const apiKeyInput = screen.getByLabelText('API Key');
      
      fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sfl-api-key', 'test-api-key');
      });
    });

    test('removes API key from localStorage when cleared', async () => {
      const apiKeyInput = screen.getByLabelText('API Key');
      
      // First set a value
      fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sfl-api-key', 'test-key');
      });

      // Then clear it
      fireEvent.change(apiKeyInput, { target: { value: '' } });
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sfl-api-key');
      });
    });

    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage unavailable');
      });

      // Component should still render without crashing
      render(<ProviderSetupPage />);
      expect(screen.getByText('AI Provider Configuration')).toBeInTheDocument();
    });

    test('initializes with saved values from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'sfl-ai-provider') return 'openai';
        if (key === 'sfl-api-key') return 'saved-api-key';
        return null;
      });

      render(<ProviderSetupPage />);
      
      const openaiRadio = screen.getByDisplayValue('openai');
      const apiKeyInput = screen.getByLabelText('API Key');
      
      expect(openaiRadio).toBeChecked();
      expect(apiKeyInput).toHaveValue('saved-api-key');
    });

    test('ignores invalid provider values from localStorage', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'sfl-ai-provider') return 'invalid-provider';
        return null;
      });

      render(<ProviderSetupPage />);
      
      // Should fall back to default 'google' provider
      const googleRadio = screen.getByDisplayValue('google');
      expect(googleRadio).toBeChecked();
    });
  });
});

// Additional tests for provider-specific components would go in separate test files
// e.g., GoogleSettings.test.tsx, OpenAISettings.test.tsx, etc.