/**
 * @file FilterControls.tsx
 * @description This component provides a set of UI controls for filtering a list of prompts.
 * It allows users to filter by a search term, topic, task type, AI persona, and output format.
 * The component receives the current filter state and callback functions to handle changes and reset actions.
 *
 * @requires react
 * @requires ../types
 * @requires ../constants
 */

import React from 'react';
import { Filters } from '../types';
import { TASK_TYPES, AI_PERSONAS, OUTPUT_FORMATS } from '../constants';

/**
 * @interface FilterControlsProps
 * @description Defines the props for the FilterControls component.
 * @property {Filters} filters - The current state of the filters.
 * @property {(key: K, value: Filters[K]) => void} onFilterChange - Callback function to update a specific filter.
 * @property {() => void} onResetFilters - Callback function to reset all filters to their default state.
 */
interface FilterControlsProps {
  filters: Filters;
  onFilterChange: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  onResetFilters: () => void;
}

/**
 * A component that renders a set of controls for filtering prompts.
 * It includes text inputs and select dropdowns for various filter criteria.
 *
 * @param {FilterControlsProps} props - The props for the component.
 * @returns {JSX.Element} The rendered filter controls form.
 */
const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, onResetFilters }) => {
  /**
   * Handles changes to any of the input or select elements.
   * It calls the `onFilterChange` prop with the updated filter key and value.
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange(name as keyof Filters, value);
  };

  return (
    <div className="bg-[#333e48] p-4 shadow-lg rounded-lg h-full flex flex-col text-gray-200">
      <h2 className="text-xl font-semibold text-[#e2a32d] mb-4 border-b pb-2 border-[#5c6f7e]">Filter Prompts</h2>
      <div className="space-y-4 flex-grow overflow-y-auto pr-2">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium text-[#95aac0] mb-1">Search Term</label>
          <input
            type="text"
            id="searchTerm"
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder="Search in title, text..."
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]"
          />
        </div>
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-[#95aac0] mb-1">Topic</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={filters.topic}
            onChange={handleInputChange}
            placeholder="e.g., History, Coding"
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors placeholder-[#95aac0]"
          />
        </div>
        <div>
          <label htmlFor="taskType" className="block text-sm font-medium text-[#95aac0] mb-1">Task Type</label>
          <select
            id="taskType"
            name="taskType"
            value={filters.taskType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors"
          >
            <option value="" className="text-[#95aac0]">All Task Types</option>
            {TASK_TYPES.map(type => <option key={type} value={type} className="bg-[#212934] text-gray-200">{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="aiPersona" className="block text-sm font-medium text-[#95aac0] mb-1">AI Persona</label>
          <select
            id="aiPersona"
            name="aiPersona"
            value={filters.aiPersona}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors"
          >
            <option value="" className="text-[#95aac0]">All Personas</option>
            {AI_PERSONAS.map(persona => <option key={persona} value={persona} className="bg-[#212934] text-gray-200">{persona}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="outputFormat" className="block text-sm font-medium text-[#95aac0] mb-1">Output Format</label>
          <select
            id="outputFormat"
            name="outputFormat"
            value={filters.outputFormat}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-[#212934] border border-[#5c6f7e] text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#e2a32d] focus:border-[#e2a32d] transition-colors"
          >
            <option value="" className="text-[#95aac0]">All Formats</option>
            {OUTPUT_FORMATS.map(format => <option key={format} value={format} className="bg-[#212934] text-gray-200">{format}</option>)}
          </select>
        </div>
      </div>
      <button
        onClick={onResetFilters}
        className="mt-6 w-full bg-[#5c6f7e] hover:bg-opacity-90 text-gray-200 font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#95aac0] focus:ring-offset-2 focus:ring-offset-[#333e48]"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterControls;
