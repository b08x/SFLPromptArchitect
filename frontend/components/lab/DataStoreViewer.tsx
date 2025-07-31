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
        return <span className="text-gray-400">null</span>;
    }
    if (typeof data !== 'object') {
        return <span className={typeof data === 'string' ? 'text-green-600' : 'text-blue-600'}>{JSON.stringify(data)}</span>;
    }

    const entries = Object.entries(data);
    const prefix = Array.isArray(data) ? '[' : '{';
    const suffix = Array.isArray(data) ? ']' : '}';

    return (
        <div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="cursor-pointer">
                <span className="text-gray-500">{prefix}</span>
                {isCollapsed && <span className="text-gray-400 mx-1">...</span>}
                <span className="text-gray-500">{suffix}</span>
                <span className="text-xs text-gray-400 ml-1">{entries.length} items</span>
            </button>
            {!isCollapsed && (
                <div style={{ paddingLeft: `${(level + 1) * 15}px` }} className="border-l border-gray-200 ml-1.5">
                    {entries.map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                            {!Array.isArray(data) && <span className="text-purple-600 mr-1">"{key}":</span>}
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
                <h3 className="text-lg font-semibold text-gray-800">Data Store</h3>
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-gray-100 rounded-md text-gray-500 hover:text-gray-800 transition-colors border border-gray-200"
                    title="Copy DataStore JSON"
                >
                    {copied ? <span className="text-xs">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                </button>
            </div>
            <div className="bg-gray-50 p-3 rounded-md text-sm border border-gray-200 h-[calc(100%-50px)] overflow-auto">
                {Object.keys(dataStore).length > 0 ? (
                    <JsonViewer data={dataStore} />
                ) : (
                    <p className="text-gray-400 text-xs">Data Store is empty. Run a workflow to populate it.</p>
                )}
            </div>
        </div>
    );
};

export default DataStoreViewer;