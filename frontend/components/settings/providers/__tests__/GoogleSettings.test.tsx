/**
 * @file GoogleSettings.test.tsx
 * @description Comprehensive tests for the GoogleSettings component
 * Tests advanced UI patterns, model-specific features, and safety settings
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoogleSettings from '../GoogleSettings';
import { ProviderSettingsProps } from '../types';
import { ProviderConfig } from '../../../../services/providerService';

// Mock provider config with Gemini models
const mockGeminiConfig: ProviderConfig = {
  provider: 'google',
  name: 'Google Gemini',
  description: 'Google AI Studio',
  models: [
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'google',
      description: 'Fast, versatile performance across a diverse variety of tasks',
      contextLength: 1000000,
      supportedParameters: ['temperature', 'top_p', 'top_k', 'max_tokens'],
      constraints: {
        temperature: { min: 0, max: 2, step: 0.01, default: 0.9 },
        top_p: { min: 0, max: 1, step: 0.01, default: 0.95 },
        top_k: { min: 1, max: 40, step: 1, default: 20 },
        max_tokens: { min: 1, max: 8192, step: 1, default: 2048 }
      }
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      description: 'Most capable model with advanced thinking features',
      contextLength: 2000000,
      supportedParameters: ['temperature', 'top_p', 'top_k', 'max_tokens', 'thinking_budget'],
      constraints: {
        temperature: { min: 0, max: 2, step: 0.01, default: 0.9 },
        top_p: { min: 0, max: 1, step: 0.01, default: 0.95 },
        top_k: { min: 1, max: 40, step: 1, default: 20 },
        max_tokens: { min: 1, max: 8192, step: 1, default: 2048 },
        thinking_budget: { min: -1, max: 10000, step: 1, default: -1 }
      }
    }
  ],
  defaultParameters: {
    temperature: 0.9,
    top_p: 0.95,
    top_k: 20,
    max_tokens: 2048
  },
  supportedFeatures: ['multimodal', 'thinking'],
  requiresApiKey: true
};

const defaultProps: ProviderSettingsProps = {
  apiKey: '',
  onApiKeyChange: jest.fn(),
  onValidate: jest.fn(),
  validationStatus: 'idle',
  validationError: undefined,
  isValidating: false,
  onSetupComplete: jest.fn(),
  provider: { provider: 'google', name: 'Google', description: 'Google AI' } as any,
  config: mockGeminiConfig
};

describe('GoogleSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the component with basic elements', () => {
      render(<GoogleSettings {...defaultProps} />);
      
      expect(screen.getByText('Google Gemini Configuration')).toBeInTheDocument();
      expect(screen.getByLabelText('Google AI Studio API Key')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /validate google api key/i })).toBeInTheDocument();
    });

    it('should display Gemini-specific features', () => {
      render(<GoogleSettings {...defaultProps} />);
      
      expect(screen.getByText('Multimodal understanding')).toBeInTheDocument();
      expect(screen.getByText('Fast inference speed')).toBeInTheDocument();
      expect(screen.getByText('Thinking capabilities (2.5+ models)')).toBeInTheDocument();
      expect(screen.getByText('Advanced safety controls')).toBeInTheDocument();
    });

    it('should show API key acquisition link', () => {
      render(<GoogleSettings {...defaultProps} />);
      
      const link = screen.getByRole('link', { name: /google ai studio/i });
      expect(link).toHaveAttribute('href', 'https://makersuite.google.com/app/apikey');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('API Key Handling', () => {
    it('should call onApiKeyChange when API key input changes', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} />);
      
      const apiKeyInput = screen.getByLabelText('Google AI Studio API Key');
      await user.type(apiKeyInput, 'AIza123');
      
      expect(defaultProps.onApiKeyChange).toHaveBeenCalledWith('A');
      expect(defaultProps.onApiKeyChange).toHaveBeenCalledWith('AI');
      // Should be called for each character typed
    });

    it('should disable validation button when API key is empty', () => {
      render(<GoogleSettings {...defaultProps} />);
      
      const validateButton = screen.getByRole('button', { name: /validate google api key/i });
      expect(validateButton).toBeDisabled();
    });

    it('should enable validation button when API key is provided', () => {
      render(<GoogleSettings {...defaultProps} apiKey="AIza123" />);
      
      const validateButton = screen.getByRole('button', { name: /validate google api key/i });
      expect(validateButton).toBeEnabled();
    });

    it('should show validating state', () => {
      render(<GoogleSettings {...defaultProps} apiKey="AIza123" isValidating={true} />);
      
      expect(screen.getByText('Validating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /validating/i })).toBeDisabled();
    });

    it('should call onValidate when validation button is clicked', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} apiKey="AIza123" />);
      
      const validateButton = screen.getByRole('button', { name: /validate google api key/i });
      await user.click(validateButton);
      
      expect(defaultProps.onValidate).toHaveBeenCalled();
    });
  });

  describe('Validation Status Display', () => {
    it('should show success message when validation is successful', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      expect(screen.getByText('Google API key validated successfully')).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should show error message when validation fails', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="invalid" validationError="Invalid API key" />);
      
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid API key')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
    });
  });

  describe('Model Selection and Parameters', () => {
    it('should not show parameter configuration before validation', () => {
      render(<GoogleSettings {...defaultProps} />);
      
      expect(screen.queryByText('Model Parameters')).not.toBeInTheDocument();
      expect(screen.queryByText('Select Gemini Model')).not.toBeInTheDocument();
    });

    it('should show parameter configuration after successful validation', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      expect(screen.getByText('Model Parameters')).toBeInTheDocument();
      expect(screen.getByText('Select Gemini Model')).toBeInTheDocument();
    });

    it('should display available models in dropdown', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const modelSelect = screen.getByLabelText('Select Gemini Model');
      expect(modelSelect).toBeInTheDocument();
      
      // Check if both models are available
      expect(screen.getByText('Gemini 1.5 Flash')).toBeInTheDocument();
      expect(screen.getByText(/Gemini 2.5 Pro.*Thinking Capable/)).toBeInTheDocument();
    });

    it('should show basic parameter controls', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Max Tokens')).toBeInTheDocument();
      
      // Should show parameter ranges
      expect(screen.getByText('0 - 2')).toBeInTheDocument(); // Temperature range
      expect(screen.getByText('1 - 8192')).toBeInTheDocument(); // Max tokens range
    });

    it('should show advanced parameters when toggled', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced/i });
      await user.click(showAdvancedButton);
      
      expect(screen.getByText('Advanced Parameters')).toBeInTheDocument();
      expect(screen.getByText('Top P (Nucleus Sampling)')).toBeInTheDocument();
      expect(screen.getByText('Top K')).toBeInTheDocument();
    });
  });

  describe('Thinking Budget Feature', () => {
    it('should not show thinking budget for non-thinking models', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Select non-thinking model
      const modelSelect = screen.getByLabelText('Select Gemini Model');
      await user.selectOptions(modelSelect, 'gemini-1.5-flash');
      
      // Show advanced parameters
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced/i });
      await user.click(showAdvancedButton);
      
      expect(screen.queryByText('Thinking Budget')).not.toBeInTheDocument();
      expect(screen.queryByText('Thinking Budget (Advanced Feature)')).not.toBeInTheDocument();
    });

    it('should show thinking budget for thinking-capable models', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Select thinking-capable model
      const modelSelect = screen.getByLabelText('Select Gemini Model');
      await user.selectOptions(modelSelect, 'gemini-2.5-pro');
      
      // Show advanced parameters
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced/i });
      await user.click(showAdvancedButton);
      
      expect(screen.getByText('Thinking Budget (Advanced Feature)')).toBeInTheDocument();
      expect(screen.getByText('Thinking Models')).toBeInTheDocument();
    });

    it('should display thinking budget explanation', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Select thinking-capable model and show advanced params
      const modelSelect = screen.getByLabelText('Select Gemini Model');
      await user.selectOptions(modelSelect, 'gemini-2.5-pro');
      
      const showAdvancedButton = screen.getByRole('button', { name: /show advanced/i });
      await user.click(showAdvancedButton);
      
      expect(screen.getByText(/This model supports "thinking"/)).toBeInTheDocument();
      expect(screen.getByText(/internal reasoning before generating/)).toBeInTheDocument();
    });
  });

  describe('Safety Settings', () => {
    it('should show safety settings toggle after validation', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      expect(screen.getByText('Safety Settings')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /show safety settings/i })).toBeInTheDocument();
    });

    it('should display safety categories when expanded', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const showSafetyButton = screen.getByRole('button', { name: /show safety settings/i });
      await user.click(showSafetyButton);
      
      expect(screen.getByText('Harmful Content')).toBeInTheDocument();
      expect(screen.getByText('Harassment')).toBeInTheDocument();
      expect(screen.getByText('Hate Speech')).toBeInTheDocument();
      expect(screen.getByText('Sexual Content')).toBeInTheDocument();
      expect(screen.getByText('Dangerous Content')).toBeInTheDocument();
    });

    it('should show safety threshold options in dropdowns', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const showSafetyButton = screen.getByRole('button', { name: /show safety settings/i });
      await user.click(showSafetyButton);
      
      // Check that safety threshold options are available
      const harmfulContentSelect = screen.getAllByRole('combobox').find(
        select => select.closest('div')?.textContent?.includes('Harmful Content')
      );
      
      expect(harmfulContentSelect).toBeInTheDocument();
      
      // Check threshold options
      await user.click(harmfulContentSelect!);
      expect(screen.getByText(/None - Allow all content/)).toBeInTheDocument();
      expect(screen.getByText(/High Only - Block only high-risk content/)).toBeInTheDocument();
    });

    it('should display safety settings warning note', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const showSafetyButton = screen.getByRole('button', { name: /show safety settings/i });
      await user.click(showSafetyButton);
      
      expect(screen.getByText('Safety Settings Note')).toBeInTheDocument();
      expect(screen.getByText(/These settings control Google's safety filters/)).toBeInTheDocument();
    });
  });

  describe('Parameter Controls Interaction', () => {
    it('should update parameter values when slider is moved', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const temperatureSlider = screen.getByDisplayValue('0.9'); // Default temperature
      await user.clear(temperatureSlider);
      await user.type(temperatureSlider, '1.5');
      
      // Should update the corresponding number input
      expect(temperatureSlider).toHaveValue(1.5);
    });

    it('should show parameter constraints and error handling', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Test temperature constraints (0-2 for Gemini)
      const temperatureInput = screen.getByDisplayValue('0.9');
      await user.clear(temperatureInput);
      await user.type(temperatureInput, '3'); // Above max
      
      await waitFor(() => {
        expect(screen.getByText('temperature must be between 0 and 2')).toBeInTheDocument();
      });
    });

    it('should provide quick preset buttons for parameters', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Find Min, Default, Max buttons for temperature
      const minButtons = screen.getAllByText('Min');
      const defaultButtons = screen.getAllByText('Default');
      const maxButtons = screen.getAllByText('Max');
      
      expect(minButtons.length).toBeGreaterThan(0);
      expect(defaultButtons.length).toBeGreaterThan(0);
      expect(maxButtons.length).toBeGreaterThan(0);
      
      // Click min button for temperature
      await user.click(minButtons[0]); // First Min button (temperature)
      
      const temperatureInput = screen.getByDisplayValue('0');
      expect(temperatureInput).toHaveValue(0);
    });
  });

  describe('Progressive Disclosure UI Patterns', () => {
    it('should implement proper progressive disclosure with toggles', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Should start with basic parameters visible
      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Max Tokens')).toBeInTheDocument();
      
      // Advanced should be hidden initially
      expect(screen.queryByText('Advanced Parameters')).not.toBeInTheDocument();
      
      // Click show advanced
      await user.click(screen.getByRole('button', { name: /show advanced/i }));
      expect(screen.getByText('Advanced Parameters')).toBeInTheDocument();
      
      // Safety settings should be hidden initially
      expect(screen.queryByText('Harmful Content')).not.toBeInTheDocument();
      
      // Click show safety settings
      await user.click(screen.getByRole('button', { name: /show safety settings/i }));
      expect(screen.getByText('Harmful Content')).toBeInTheDocument();
    });

    it('should show toggle state changes correctly', async () => {
      const user = userEvent.setup();
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      const advancedToggle = screen.getByRole('button', { name: /show advanced/i });
      expect(advancedToggle).toHaveTextContent('Show Advanced');
      
      await user.click(advancedToggle);
      expect(advancedToggle).toHaveTextContent('Hide Advanced');
      
      await user.click(advancedToggle);
      expect(advancedToggle).toHaveTextContent('Show Advanced');
    });
  });

  describe('Visual Indicators and Help', () => {
    it('should show tooltips for parameter explanations', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Should have info icons for parameters
      const infoIcons = screen.getAllByRole('button').filter(
        button => button.querySelector('svg path[d*="M13 16h-1v-4h-1m1-4h.01M21 12a9"]')
      );
      expect(infoIcons.length).toBeGreaterThan(0);
    });

    it('should display model capability indicators', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Should show thinking capability in model selection
      expect(screen.getByText(/Thinking Capable/)).toBeInTheDocument();
    });

    it('should show parameter ranges and validation feedback', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // Should show parameter ranges
      expect(screen.getByText('0 - 2')).toBeInTheDocument(); // Temperature
      expect(screen.getByText('0 - 1')).toBeInTheDocument(); // Top P (when advanced is shown)
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // API key input should have proper label
      expect(screen.getByLabelText('Google AI Studio API Key')).toBeInTheDocument();
      
      // Model selection should have proper label
      expect(screen.getByLabelText('Select Gemini Model')).toBeInTheDocument();
      
      // Buttons should have proper labels
      expect(screen.getByRole('button', { name: /validate google api key/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<GoogleSettings {...defaultProps} validationStatus="valid" />);
      
      // All interactive elements should be focusable
      const apiKeyInput = screen.getByLabelText('Google AI Studio API Key');
      const validateButton = screen.getByRole('button', { name: /validate google api key/i });
      
      expect(apiKeyInput).toBeEnabled();
      expect(validateButton).toBeEnabled();
    });
  });
});