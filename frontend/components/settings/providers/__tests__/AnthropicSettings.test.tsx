/**
 * @file AnthropicSettings.test.tsx
 * @description Unit tests for the AnthropicSettings component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnthropicSettings from '../AnthropicSettings';
import { ProviderSettingsProps } from '../types';

// Mock props for testing
const mockProps: ProviderSettingsProps = {
  apiKey: '',
  onApiKeyChange: jest.fn(),
  onValidate: jest.fn(),
  validationStatus: 'idle',
  validationError: undefined,
  isValidating: false,
  onSetupComplete: jest.fn(),
  provider: 'anthropic',
  config: undefined,
};

describe('AnthropicSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the basic component structure', () => {
    render(<AnthropicSettings {...mockProps} />);
    
    expect(screen.getByText('Anthropic Claude Configuration')).toBeInTheDocument();
    expect(screen.getByLabelText('Anthropic API Key')).toBeInTheDocument();
    expect(screen.getByText('Validate Anthropic API Key')).toBeInTheDocument();
  });

  it('calls onApiKeyChange when API key input changes', () => {
    render(<AnthropicSettings {...mockProps} />);
    
    const input = screen.getByLabelText('Anthropic API Key');
    fireEvent.change(input, { target: { value: 'sk-ant-test-key' } });
    
    expect(mockProps.onApiKeyChange).toHaveBeenCalledWith('sk-ant-test-key');
  });

  it('calls onValidate when validate button is clicked', () => {
    render(<AnthropicSettings {...mockProps} apiKey="sk-ant-test-key" />);
    
    const validateButton = screen.getByText('Validate Anthropic API Key');
    fireEvent.click(validateButton);
    
    expect(mockProps.onValidate).toHaveBeenCalled();
  });

  it('disables validate button when API key is empty', () => {
    render(<AnthropicSettings {...mockProps} apiKey="" />);
    
    const validateButton = screen.getByText('Validate Anthropic API Key');
    expect(validateButton).toBeDisabled();
  });

  it('disables validate button when validating', () => {
    render(<AnthropicSettings {...mockProps} apiKey="sk-ant-test-key" isValidating={true} />);
    
    const validateButton = screen.getByText('Validating...');
    expect(validateButton).toBeDisabled();
  });

  it('shows validation success status', () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    expect(screen.getByText('Anthropic API key validated successfully')).toBeInTheDocument();
  });

  it('shows validation error status', () => {
    render(<AnthropicSettings {...mockProps} validationStatus="invalid" validationError="Invalid API key" />);
    
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
    expect(screen.getByText('Invalid API key')).toBeInTheDocument();
  });

  it('shows parameter controls when API key is validated', () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    expect(screen.getByText('Model Parameters')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Max Tokens')).toBeInTheDocument();
  });

  it('shows advanced parameters when advanced toggle is clicked', async () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    const advancedToggle = screen.getByText('Show Advanced');
    fireEvent.click(advancedToggle);
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Parameters')).toBeInTheDocument();
      expect(screen.getByText('Top P (Nucleus Sampling)')).toBeInTheDocument();
      expect(screen.getByText('Top K')).toBeInTheDocument();
    });
  });

  it('updates parameter values when sliders are changed', async () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    const temperatureSlider = screen.getByDisplayValue('0.7'); // Default temperature value
    fireEvent.change(temperatureSlider, { target: { value: '0.8' } });
    
    await waitFor(() => {
      expect(temperatureSlider).toHaveValue('0.8');
    });
  });

  it('updates system message when textarea is changed', async () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    const systemMessageTextarea = screen.getByPlaceholderText('Enter a system message to set Claude\'s behavior and context...');
    fireEvent.change(systemMessageTextarea, { target: { value: 'Test system message' } });
    
    await waitFor(() => {
      expect(systemMessageTextarea).toHaveValue('Test system message');
    });
  });

  it('initializes parameters from config prop', () => {
    const configWithParams = {
      temperature: 0.5,
      top_p: 0.7,
      top_k: 30,
      max_tokens: 1000,
      system: 'Test system message',
    };
    
    render(<AnthropicSettings {...mockProps} config={configWithParams} validationStatus="valid" />);
    
    expect(screen.getByDisplayValue('0.5')).toBeInTheDocument(); // Temperature
    expect(screen.getByDisplayValue('1000')).toBeInTheDocument(); // Max tokens
    expect(screen.getByDisplayValue('Test system message')).toBeInTheDocument(); // System message
  });

  it('shows parameter validation errors', async () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    // Try to set temperature above maximum
    const temperatureInput = screen.getByDisplayValue('0.7');
    fireEvent.change(temperatureInput, { target: { value: '2.0' } });
    
    await waitFor(() => {
      expect(screen.getByText('temperature must be between 0 and 1')).toBeInTheDocument();
    });
  });

  it('resets parameters to default values when preset buttons are clicked', async () => {
    render(<AnthropicSettings {...mockProps} validationStatus="valid" />);
    
    // Change temperature first
    const temperatureSlider = screen.getByDisplayValue('0.7');
    fireEvent.change(temperatureSlider, { target: { value: '0.9' } });
    
    // Click default button
    const defaultButton = screen.getAllByText('Default')[0]; // First default button (temperature)
    fireEvent.click(defaultButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('0.7')).toBeInTheDocument(); // Back to default
    });
  });
});