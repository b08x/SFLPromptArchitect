/**
 * @file ParameterControls.tsx
 * @description This component provides detailed parameter configuration controls for AI models.
 * It offers advanced parameter tuning with validation, presets, and real-time feedback
 * on parameter effects and constraints.
 *
 * @requires react
 * @requires ../types/aiProvider
 * @requires ../config/modelCapabilities
 */

import React, { useState, useEffect } from 'react';
import { AIProvider, ModelParameters, ParameterPreset } from '../types/aiProvider';
import { 
  getParameterConstraints, 
  getProviderPresets, 
  validateParameters,
  PARAMETER_PRESETS 
} from '../config/modelCapabilities';
import CogIcon from './icons/CogIcon';
import BeakerIcon from './icons/BeakerIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';

/**
 * @interface ParameterControlsProps
 * @description Defines the props for the ParameterControls component.
 */
interface ParameterControlsProps {
  /** Current AI provider */
  provider: AIProvider;
  /** Current model ID */
  modelId: string;
  /** Current parameter values */
  parameters: ModelParameters;
  /** Callback when parameters change */
  onParametersChange: (parameters: ModelParameters) => void;
  /** Whether to show advanced controls */
  showAdvanced?: boolean;
  /** Whether to show parameter descriptions */
  showDescriptions?: boolean;
}

/**
 * Parameter information for user guidance
 */
const PARAMETER_INFO: Record<string, { description: string; effect: string }> = {
  temperature: {
    description: "Controls randomness in generation",
    effect: "Higher values (0.8-2.0) = more creative, lower values (0.1-0.5) = more focused"
  },
  maxTokens: {
    description: "Maximum number of tokens to generate",
    effect: "Higher values = longer responses, lower values = shorter responses"
  },
  topK: {
    description: "Limits vocabulary to top K most likely tokens",
    effect: "Lower values = more focused, higher values = more diverse"
  },
  topP: {
    description: "Nucleus sampling threshold",
    effect: "Lower values (0.1-0.5) = more focused, higher values (0.8-1.0) = more diverse"
  },
  top_p: {
    description: "Nucleus sampling threshold (OpenAI format)",
    effect: "Lower values (0.1-0.5) = more focused, higher values (0.8-1.0) = more diverse"
  },
  top_k: {
    description: "Top-K sampling parameter",
    effect: "Lower values = more focused, higher values = more diverse"
  },
  presence_penalty: {
    description: "Penalizes tokens based on presence in text",
    effect: "Positive values discourage repetition, negative values encourage repetition"
  },
  frequency_penalty: {
    description: "Penalizes tokens based on frequency in text",
    effect: "Positive values reduce repetitive content, negative values increase repetition"
  },
  repetition_penalty: {
    description: "Penalizes repeated tokens",
    effect: "Values > 1.0 discourage repetition, values < 1.0 encourage repetition"
  },
  min_p: {
    description: "Minimum probability threshold for token selection",
    effect: "Higher values = more conservative choices, lower values = more creative"
  }
};

/**
 * A comprehensive component for configuring AI model parameters with
 * validation, presets, and detailed control over generation behavior.
 *
 * @param {ParameterControlsProps} props - The component props
 * @returns {JSX.Element} The rendered parameter controls
 */
const ParameterControls: React.FC<ParameterControlsProps> = ({
  provider,
  modelId,
  parameters,
  onParametersChange,
  showAdvanced = true,
  showDescriptions = true
}) => {
  // Local state
  const [constraints, setConstraints] = useState<any>({});
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [availablePresets, setAvailablePresets] = useState<ParameterPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState<string>('');

  // Load constraints and presets when provider/model changes
  useEffect(() => {
    const modelConstraints = getParameterConstraints(provider, modelId);
    setConstraints(modelConstraints);
    
    const presets = getProviderPresets(provider);
    setAvailablePresets(presets);
    
    // Validate current parameters
    const validationResult = validateParameters(provider, modelId, parameters);
    setValidation(validationResult);
  }, [provider, modelId]);

  // Validate parameters when they change
  useEffect(() => {
    const validationResult = validateParameters(provider, modelId, parameters);
    setValidation(validationResult);
  }, [parameters, provider, modelId]);

  /**
   * Handle parameter value change
   */
  const handleParameterChange = (paramName: string, value: number | string) => {
    const newParameters = {
      ...parameters,
      [paramName]: value
    };
    
    onParametersChange(newParameters);
    setSelectedPreset(''); // Clear preset selection when manually changing parameters
  };

  /**
   * Apply a parameter preset
   */
  const applyPreset = (presetName: string) => {
    const preset = availablePresets.find(p => p.name === presetName);
    if (preset) {
      onParametersChange(preset.parameters);
      setSelectedPreset(presetName);
    }
  };

  /**
   * Reset parameters to defaults
   */
  const resetToDefaults = () => {
    const defaultPreset = availablePresets.find(p => p.name.toLowerCase().includes('balanced'));
    if (defaultPreset) {
      onParametersChange(defaultPreset.parameters);
      setSelectedPreset(defaultPreset.name);
    }
  };

  /**
   * Render a single parameter control
   */
  const renderParameterControl = (paramName: string, constraint: any) => {
    const currentValue = (parameters as any)[paramName] ?? constraint.default;
    const paramInfo = PARAMETER_INFO[paramName];
    const hasError = validation.errors.some(error => error.includes(paramName));

    return (
      <div key={paramName} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-[#95aac0] capitalize">
              {paramName.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
            </label>
            {paramInfo && showDescriptions && (
              <div className="relative">
                <button
                  onMouseEnter={() => setShowTooltip(paramName)}
                  onMouseLeave={() => setShowTooltip('')}
                  className="text-[#95aac0] hover:text-[#e2a32d]"
                >
                  <QuestionMarkCircleIcon className="w-4 h-4" />
                </button>
                {showTooltip === paramName && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 w-64 p-3 bg-[#212934] border border-[#5c6f7e] rounded-lg shadow-lg">
                    <p className="text-xs text-gray-200 mb-2">{paramInfo.description}</p>
                    <p className="text-xs text-[#95aac0]">{paramInfo.effect}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasError && <XCircleIcon className="w-4 h-4 text-red-500" />}
            <span className="text-xs text-[#95aac0]">
              {constraint.min} - {constraint.max}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Range Slider */}
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min={constraint.min}
              max={constraint.max}
              step={constraint.step}
              value={currentValue}
              onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
              className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${
                hasError ? 'bg-red-900' : 'bg-[#5c6f7e]'
              } slider`}
            />
            <input
              type="number"
              min={constraint.min}
              max={constraint.max}
              step={constraint.step}
              value={currentValue}
              onChange={(e) => handleParameterChange(paramName, parseFloat(e.target.value))}
              className={`w-20 px-2 py-1 text-sm bg-[#212934] border rounded text-gray-200 focus:outline-none ${
                hasError 
                  ? 'border-red-500 focus:border-red-400' 
                  : 'border-[#5c6f7e] focus:border-[#e2a32d]'
              }`}
            />
          </div>

          {/* Quick Value Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleParameterChange(paramName, constraint.min)}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Min
            </button>
            <button
              onClick={() => handleParameterChange(paramName, constraint.default)}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Default
            </button>
            <button
              onClick={() => handleParameterChange(paramName, constraint.max)}
              className="px-2 py-1 text-xs bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
            >
              Max
            </button>
          </div>
        </div>
      </div>
    );
  };

  const sortedConstraints = Object.entries(constraints).sort(([a], [b]) => {
    // Sort temperature and maxTokens first, then alphabetically
    const priority = ['temperature', 'maxTokens', 'topK', 'topP', 'top_p', 'top_k'];
    const aIndex = priority.indexOf(a);
    const bIndex = priority.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="bg-[#333e48] border border-[#5c6f7e] rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CogIcon className="w-5 h-5 text-[#e2a32d]" />
          <h3 className="text-sm font-semibold text-[#e2a32d]">Model Parameters</h3>
        </div>
        <div className="flex items-center space-x-2">
          {validation.valid ? (
            <div className="flex items-center space-x-1">
              <CheckCircleIcon className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-500">Valid</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <XCircleIcon className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-500">{validation.errors.length} errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.valid && (
        <div className="p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-xs text-red-400">{error}</p>
          ))}
        </div>
      )}

      {/* Presets */}
      {availablePresets.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <BeakerIcon className="w-4 h-4 text-[#95aac0]" />
            <label className="text-sm font-medium text-[#95aac0]">Presets</label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset.name)}
                className={`p-2 text-left rounded border transition-colors ${
                  selectedPreset === preset.name
                    ? 'border-[#e2a32d] bg-[#e2a32d] bg-opacity-10'
                    : 'border-[#5c6f7e] hover:border-[#95aac0]'
                }`}
              >
                <div className="text-sm font-medium text-gray-200">{preset.name}</div>
                <div className="text-xs text-[#95aac0]">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Parameter Controls */}
      {sortedConstraints.length > 0 && (
        <div className="space-y-4">
          <label className="text-sm font-medium text-[#95aac0]">Parameters</label>
          <div className="space-y-4">
            {sortedConstraints.map(([paramName, constraint]) =>
              renderParameterControl(paramName, constraint)
            )}
          </div>
        </div>
      )}

      {/* Advanced Parameters */}
      {showAdvanced && sortedConstraints.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-[#95aac0]">No parameters available for this model</p>
        </div>
      )}

      {/* Reset Button */}
      <div className="flex justify-end pt-2 border-t border-[#5c6f7e]">
        <button
          onClick={resetToDefaults}
          className="px-3 py-1 text-sm bg-[#212934] border border-[#5c6f7e] rounded text-gray-200 hover:border-[#e2a32d] transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default ParameterControls;