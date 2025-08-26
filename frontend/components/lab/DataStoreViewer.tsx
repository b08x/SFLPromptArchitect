/**
 * @file DataStoreViewer.tsx
 * @description This component provides a read-only, collapsible JSON viewer for inspecting the state of the workflow's Data Store.
 * It includes a button to copy the entire Data Store content as a JSON string.
 * Enhanced with visual indicators to highlight staged user input content with badges showing input types (text, image, file).
 *
 * @requires react
 * @requires ../types
 * @requires ../icons/ClipboardIcon
 * @requires ../icons/DocumentTextIcon
 * @requires ../icons/PaperClipIcon
 * @requires ../icons/EyeIcon
 */

import React, { useState } from 'react';
import { DataStore, StagedUserInput } from '../../types';
import ClipboardIcon from '../icons/ClipboardIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import PaperClipIcon from '../icons/PaperClipIcon';
import EyeIcon from '../icons/EyeIcon';

/**
 * Checks if the given data represents staged user input with content.
 * @param {any} data - The data to check.
 * @returns {StagedUserInput | null} The staged user input if found, null otherwise.
 */
const getStagedUserInput = (data: any): StagedUserInput | null => {
    if (!data || typeof data !== 'object') return null;
    
    const hasText = data.text && typeof data.text === 'string' && data.text.trim().length > 0;
    const hasImage = data.image && data.image.name && data.image.base64;
    const hasFile = data.file && data.file.name && data.file.content;
    
    if (hasText || hasImage || hasFile) {
        return data as StagedUserInput;
    }
    
    return null;
};

/**
 * Renders badges/pills indicating what types of input are staged.
 * @param {StagedUserInput} stagedInput - The staged user input data.
 * @returns {React.ReactElement[]} An array of badge elements.
 */
const renderStagedInputBadges = (stagedInput: StagedUserInput): React.ReactElement[] => {
    const badges: React.ReactElement[] = [];
    
    if (stagedInput.text && stagedInput.text.trim().length > 0) {
        badges.push(
            <div key="text" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200">
                <DocumentTextIcon className="w-3 h-3" />
                <span>Text ({stagedInput.text.length} chars)</span>
            </div>
        );
    }
    
    if (stagedInput.image) {
        badges.push(
            <div key="image" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200">
                <EyeIcon className="w-3 h-3" />
                <span>Image ({stagedInput.image.name})</span>
            </div>
        );
    }
    
    if (stagedInput.file) {
        badges.push(
            <div key="file" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-200">
                <PaperClipIcon className="w-3 h-3" />
                <span>File ({stagedInput.file.name})</span>
            </div>
        );
    }
    
    return badges;
};

/**
 * A recursive component to render a collapsible JSON tree.
 * @param {object} props - The component props.
 * @param {any} props.data - The JSON data to render.
 * @param {number} [props.level=0] - The current nesting level, used for indentation.
 * @param {string} [props.parentKey] - The key of the parent object, used to identify special sections.
 * @returns {React.ReactElement} A styled, interactive JSON tree view.
 */
const JsonViewer: React.FC<{ data: any; level?: number; parentKey?: string }> = ({ data, level = 0, parentKey }) => {
    const [isCollapsed, setIsCollapsed] = useState(level > 0);

    if (data === null || data === undefined) {
        return <span className="text-text-tertiary">null</span>;
    }
    if (typeof data !== 'object') {
        return <span className={typeof data === 'string' ? 'text-success' : 'text-info'}>{JSON.stringify(data)}</span>;
    }

    const entries = Object.entries(data);
    const prefix = Array.isArray(data) ? '[' : '{';
    const suffix = Array.isArray(data) ? ']' : '}';
    
    // Check if this is the userInput section and if it has staged data
    const isUserInputSection = parentKey === 'userInput';
    const stagedInput = isUserInputSection ? getStagedUserInput(data) : null;

    return (
        <div className={stagedInput ? 'bg-amber-50 border border-amber-200 rounded-md p-2' : ''}>
            {stagedInput && (
                <div className="mb-2 flex flex-wrap gap-1">
                    <div className="text-xs font-medium text-amber-800 mb-1">Staged User Input:</div>
                    {renderStagedInputBadges(stagedInput)}
                </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="cursor-pointer">
                <span className="text-text-secondary">{prefix}</span>
                {isCollapsed && <span className="text-text-tertiary mx-1">...</span>}
                <span className="text-text-secondary">{suffix}</span>
                <span className="text-xs text-text-tertiary ml-1">{entries.length} items</span>
            </button>
            {!isCollapsed && (
                <div style={{ paddingLeft: `${(level + 1) * 15}px` }} className="border-l border-border-primary ml-1.5">
                    {entries.map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                            {!Array.isArray(data) && (
                                <span className={`mr-1 ${key === 'userInput' && getStagedUserInput(value) ? 'text-amber-600 font-medium' : 'text-accent-primary'}`}>
                                    "{key}":
                                </span>
                            )}
                            <JsonViewer data={value} level={level + 1} parentKey={key} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/**
 * A component that displays the entire Data Store of a workflow run.
 * It uses the `JsonViewer` to render the data and provides a copy-to-clipboard functionality.
 * Enhanced with visual indicators to highlight staged user input content.
 *
 * @param {object} props - The component props.
 * @param {DataStore} props.dataStore - The Data Store object to display.
 * @returns {React.ReactElement} The rendered Data Store viewer component.
 */
const DataStoreViewer: React.FC<{ dataStore: DataStore }> = ({ dataStore }) => {
    const [copied, setCopied] = useState(false);

    /**
     * Copies the Data Store content to the clipboard as a formatted JSON string.
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(dataStore, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Check if there's staged user input in the data store
    const stagedInput = dataStore.userInput ? getStagedUserInput(dataStore.userInput) : null;

    return (
        <div className="p-4 h-full font-mono">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-text-primary">Data Store</h3>
                    {stagedInput && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-200">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                            <span>Staged Input</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-surface-hover rounded-md text-text-tertiary hover:text-text-primary transition-colors border border-border-primary"
                    title="Copy DataStore JSON"
                >
                    {copied ? <span className="text-xs">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                </button>
            </div>
            <div className="bg-surface p-3 rounded-md text-sm border border-border-primary h-[calc(100%-50px)] overflow-auto">
                {Object.keys(dataStore).length > 0 ? (
                    <JsonViewer data={dataStore} />
                ) : (
                    <p className="text-text-tertiary text-xs">Data Store is empty. Run a workflow to populate it.</p>
                )}
            </div>
        </div>
    );
};

export default DataStoreViewer;