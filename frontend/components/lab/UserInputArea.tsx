/**
 * @file UserInputArea.tsx
 * @description This component provides a tabbed interface for users to input text, upload an image, or upload a text file.
 * The provided input is then "staged" to be used as the initial data for a workflow run.
 *
 * @requires react
 * @requires ../../types
 * @requires ../icons/PaperClipIcon
 * @requires ../icons/DocumentTextIcon
 */

import React, { useState } from 'react';
import { StagedUserInput, Workflow } from '../../types';
import PaperClipIcon from '../icons/PaperClipIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import MagicWandIcon from '../icons/MagicWandIcon';
import { orchestrateWorkflow } from '../../services/workflowEngine';

type Tab = 'text' | 'image' | 'file';

/**
 * @interface UserInputAreaProps
 * @description Defines the props for the UserInputArea component.
 * @property {(input: StagedUserInput) => void} onStageInput - Callback function to stage the user's input for the workflow.
 * @property {(workflow: Workflow) => void} onWorkflowGenerated - Callback function when AI generates a workflow from user input.
 */
interface UserInputAreaProps {
    onStageInput: (input: StagedUserInput) => void;
    onWorkflowGenerated: (workflow: Workflow) => void;
}

/**
 * A component that allows users to provide various types of input for a workflow.
 * It features tabs for text, image, and file inputs and a button to stage the data.
 * Also includes AI orchestration functionality for generating workflows from natural language descriptions.
 *
 * @param {UserInputAreaProps} props - The props for the component.
 * @returns {JSX.Element} The rendered user input area.
 */
const UserInputArea: React.FC<UserInputAreaProps> = ({ onStageInput, onWorkflowGenerated }) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [text, setText] = useState('');
    const [image, setImage] = useState<{ name: string; type: string; base64: string, preview: string } | null>(null);
    const [file, setFile] = useState<{ name: string; content: string } | null>(null);
    const [isOrchestrating, setIsOrchestrating] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile && uploadedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                const preview = URL.createObjectURL(uploadedFile);
                setImage({ name: uploadedFile.name, type: uploadedFile.type, base64, preview });
            };
            reader.readAsDataURL(uploadedFile);
        }
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if(uploadedFile && uploadedFile.type.startsWith('text/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFile({ name: uploadedFile.name, content: event.target?.result as string });
            };
            reader.readAsText(uploadedFile);
        }
    }

    const handleStage = () => {
        onStageInput({ text, image, file });
        alert('Input has been staged for the workflow.');
    };

    const handleOrchestrate = async () => {
        if (!text.trim()) {
            alert('Please enter a text description in the Text tab to generate a workflow.');
            setActiveTab('text');
            return;
        }

        if (text.length > 2000) {
            alert('Request description is too long. Please limit to 2000 characters.');
            return;
        }

        setIsOrchestrating(true);
        try {
            const generatedWorkflow = await orchestrateWorkflow(text.trim());
            onWorkflowGenerated(generatedWorkflow);
            alert(`Successfully generated workflow: "${generatedWorkflow.name}" with ${generatedWorkflow.tasks.length} tasks!`);
        } catch (error: any) {
            console.error('Workflow orchestration failed:', error);
            alert(`Failed to generate workflow: ${error.message}`);
        } finally {
            setIsOrchestrating(false);
        }
    };

    const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${
                activeTab === tabId
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex-grow flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-2">User Input</h2>
            <div className="border-b border-gray-200 -mx-4 px-4">
                <nav className="-mb-px flex space-x-4">
                    <TabButton tabId="text">Text</TabButton>
                    <TabButton tabId="image">Image</TabButton>
                    <TabButton tabId="file">File</TabButton>
                </nav>
            </div>
            <div className="flex-grow pt-4">
                {activeTab === 'text' && (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste article text or other content here..."
                        className="w-full h-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                )}
                {activeTab === 'image' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {image ? (
                            <div className="text-center">
                                <img src={image.preview} alt={image.name} className="max-h-40 rounded-md border border-gray-300" />
                                <p className="text-xs mt-2 text-gray-600 truncate">{image.name}</p>
                                <button onClick={() => setImage(null)} className="text-xs text-red-500 mt-1">Remove</button>
                            </div>
                        ) : (
                            <label htmlFor="image-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-300 rounded-md text-center hover:bg-gray-100">
                                <PaperClipIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload image</span>
                            </label>
                        )}
                    </div>
                )}
                 {activeTab === 'file' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="file-upload" className="hidden" accept=".txt,.md" onChange={handleFileUpload} />
                        {file ? (
                            <div className="text-center">
                                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-500"/>
                                <p className="text-sm mt-2 text-gray-700">{file.name}</p>
                                <button onClick={() => setFile(null)} className="text-xs text-red-500 mt-1">Remove</button>
                            </div>
                        ) : (
                             <label htmlFor="file-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-300 rounded-md text-center hover:bg-gray-100">
                                <PaperClipIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <span className="text-sm text-gray-600">Click to upload text file</span>
                            </label>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleStage}
                    className="flex-1 bg-[#4A69E2] text-white py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors"
                >
                    Stage Input for Workflow
                </button>
                <button
                    onClick={handleOrchestrate}
                    disabled={isOrchestrating || !text.trim()}
                    className="flex-1 bg-purple-600 text-white py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title={!text.trim() ? "Enter a description in the Text tab to generate a workflow" : "Generate workflow from description using AI"}
                >
                    <MagicWandIcon className="w-4 h-4" />
                    {isOrchestrating ? 'Generating...' : 'Magic Wand'}
                </button>
            </div>
        </div>
    );
};

export default UserInputArea;
