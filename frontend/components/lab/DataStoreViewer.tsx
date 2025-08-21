/**
 * @file DataStoreViewer.tsx
 * @description This component provides a read-only, collapsible JSON viewer for inspecting the state of the workflow's Data Store.
 * It includes a button to copy the entire Data Store content as a JSON string.
 *
 * @requires react
 * @requires ../types
 * @requires ../icons/ClipboardIcon
 */

import React, { useState } from 'react';
import { DataStore } from '../../types';
import ClipboardIcon from '../icons/ClipboardIcon';

/**
 * A recursive component to render a collapsible JSON tree.
 * @param {object} props - The component props.
 * @param {any} props.data - The JSON data to render.
 * @param {number} [props.level=0] - The current nesting level, used for indentation.
 * @returns {JSX.Element} A styled, interactive JSON tree view.
 */
const JsonViewer: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
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

    return (
        <div>
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
                            {!Array.isArray(data) && <span className="text-accent-primary mr-1">"{key}":</span>}
                            <JsonViewer data={value} level={level + 1} />
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
 *
 * @param {object} props - The component props.
 * @param {DataStore} props.dataStore - The Data Store object to display.
 * @returns {JSX.Element} The rendered Data Store viewer component.
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

    return (
        <div className="p-4 h-full font-mono">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Data Store</h3>
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