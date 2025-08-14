/**
 * @file Documentation.tsx
 * @description This component renders the main documentation page for the SFL Prompt Architect.
 * It explains the core concepts of Systemic Functional Linguistics (SFL) and highlights the key features of the application.
 * It is composed of several sub-components: `FeatureCard`, `SFLConcept`, and `Step` to structure the information clearly.
 *
 * @requires react
 * @requires ./icons/BookOpenIcon
 * @requires ./icons/CubeIcon
 * @requires ./icons/UsersIcon
 * @requires ./icons/DocumentTextIcon
 * @requires ./icons/MagicWandIcon
 * @requires ./icons/SparklesIcon
 * @requires ./icons/BeakerIcon
 * @requires ./icons/ArrowDownTrayIcon
 * @requires ./icons/FlaskIcon
 * @requires ./icons/ArrowsRightLeftIcon
 * @requires ./icons/PlayIcon
 * @requires ./icons/CodeBracketIcon
 */

import React from 'react';
import BookOpenIcon from './icons/BookOpenIcon';
import CubeIcon from './icons/CubeIcon';
import UsersIcon from './icons/UsersIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import SparklesIcon from './icons/SparklesIcon';
import BeakerIcon from './icons/BeakerIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import FlaskIcon from './icons/FlaskIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import PlayIcon from './icons/PlayIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';

/**
 * A reusable card component to display a key feature of the application.
 * It combines an icon, a title, and a description in a visually distinct block.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - The icon element to display for the feature.
 * @param {string} props.title - The title of the feature.
 * @param {React.ReactNode} props.children - The descriptive text for the feature.
 * @returns {JSX.Element} A styled card element for showcasing a feature.
 * @private
 */
const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 h-full">
        <div className="flex items-center space-x-4 mb-3">
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{children}</p>
    </div>
);

/**
 * A component designed to explain a single SFL concept (Field, Tenor, or Mode).
 * It presents the concept's name, its guiding question, and a detailed explanation.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - The icon representing the SFL concept.
 * @param {string} props.title - The name of the concept (e.g., "Field").
 * @param {string} props.question - The key question the concept answers (e.g., "What is happening?").
 * @param {React.ReactNode} props.children - The detailed explanation of the concept.
 * @returns {JSX.Element} A styled component that clearly explains an SFL concept.
 * @private
 */
const SFLConcept: React.FC<{ icon: React.ReactNode; title: string; question: string; children: React.ReactNode; }> = ({ icon, title, question, children }) => (
    <div className="bg-gray-50/70 p-5 rounded-lg border border-gray-200/80">
        <div className="flex items-center space-x-3 mb-2">
            {icon}
            <div>
                <h4 className="font-bold text-gray-900">{title}</h4>
                <p className="text-sm text-gray-500 italic">"{question}"</p>
            </div>
        </div>
        <p className="text-sm text-gray-700 pl-9">{children}</p>
    </div>
);

/**
 * A component to display a single step in a process or instructional guide.
 * It combines an icon, a title, and a description to clearly outline each step.
 *
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - The icon for the step.
 * @param {string} props.title - The title of the step.
 * @param {React.ReactNode} props.children - The description of the step's action.
 * @returns {JSX.Element} A styled step component.
 * @private
 */
const Step: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="flex space-x-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-1">{title}</h4>
            <p className="text-gray-600 text-sm">{children}</p>
        </div>
    </div>
);

/**
 * The main documentation component for the application.
 * It provides a comprehensive, user-friendly guide to using the SFL Prompt Architect.
 * The page is structured into sections covering the SFL framework, key application features,
 * and a step-by-step guide on how to create and use prompts and workflows effectively.
 *
 * @returns {JSX.Element} The rendered documentation page.
 */
const Documentation: React.FC = () => {
    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-gray-200 text-center">
                <BookOpenIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome to SFL Prompt Architect</h1>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    This guide provides everything you need to know to harness the power of Systemic Functional Linguistics (SFL) for precise and effective AI prompt engineering.
                </p>
            </header>

            {/* SFL Concepts */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-1 text-center">The SFL Framework</h2>
                <p className="text-center text-gray-500 mb-8 max-w-2xl mx-auto">SFL helps you control AI output by defining the context of communication. By specifying the Field, Tenor, and Mode, you tell the AI exactly what to do, how to behave, and what structure to use.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SFLConcept icon={<CubeIcon className="w-6 h-6 text-blue-600" />} title="Field" question="What is happening?">
                        Specifies the subject matter and knowledge domain. This tells the model <span className="font-semibold">what to talk about</span> (e.g., 'Quantum Physics', 'Python Programming').
                    </SFLConcept>
                    <SFLConcept icon={<UsersIcon className="w-6 h-6 text-indigo-600" />} title="Tenor" question="Who is taking part?">
                        Defines the social roles and relationships. This tells the model <span className="font-semibold">how to behave</span> (e.g., 'Expert Persona', 'Friendly Tone').
                    </SFLConcept>
                    <SFLConcept icon={<DocumentTextIcon className="w-6 h-6 text-green-600" />} title="Mode" question="What is language doing?">
                        Relates to the text's organization and format. This tells the model <span className="font-semibold">how to structure its response</span> (e.g., 'JSON format', 'Bulleted List').
                    </SFLConcept>
                </div>
            </section>

            {/* Key Features */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FeatureCard icon={<MagicWandIcon className="w-6 h-6" />} title="Prompt Wizard">
                        Don't know where to start? Just describe your goal, and the wizard will generate a complete, SFL-structured prompt for you using Gemini.
                    </FeatureCard>
                    <FeatureCard icon={<SparklesIcon className="w-6 h-6" />} title="AI-Powered Refinement">
                        Already have a prompt? Use natural language to refine it. Tell the AI "make this more formal" and it will update all SFL fields accordingly.
                    </FeatureCard>
                    <FeatureCard icon={<BeakerIcon className="w-6 h-6" />} title="Direct Gemini Testing">
                        Instantly test your prompts with Gemini directly within the app. See the AI's response and iterate quickly without leaving the page.
                    </FeatureCard>
                     <FeatureCard icon={<FlaskIcon className="w-6 h-6" />} title="Prompt Lab & Workflows">
                        Move beyond single prompts. Chain multiple prompts and logic steps together in the Prompt Lab to create powerful, automated workflows and sophisticated AI agents.
                    </FeatureCard>
                    <FeatureCard icon={<ArrowDownTrayIcon className="w-6 h-6" />} title="Import & Export">
                        Easily share your prompt libraries and workflows with your team. Export all prompts as a single JSON or Markdown file, and import libraries from others.
                    </FeatureCard>
                </div>
            </section>

            {/* How to use */}
            <section>
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Your Path to Mastery: From Prompt to Workflow</h2>
                <div className="max-w-3xl mx-auto space-y-8">
                    <Step icon={<MagicWandIcon className="w-6 h-6"/>} title="1. Build Your Library">
                        Use the SFL editor or the AI Wizard to craft high-quality, reusable prompts. A strong, well-defined library is the foundation of powerful and consistent workflows.
                    </Step>
                    <Step icon={<FlaskIcon className="w-6 h-6"/>} title="2. Enter the Prompt Lab">
                        Navigate to the Lab to design your automated agent. Add tasks like Gemini prompts, data inputs, and custom text manipulation to build your workflow's structure.
                    </Step>
                    <Step icon={<ArrowsRightLeftIcon className="w-6 h-6"/>} title="3. Link Prompts & Define Logic">
                        The real power comes from connecting your library. Link a `GEMINI_PROMPT` task to a prompt from your SFL library. Define dependencies to control the flow of data from one task to the next.
                    </Step>
                    <Step icon={<PlayIcon className="w-6 h-6"/>} title="4. Provide Input & Run">
                        Use the User Input Area to stage any necessary text or images for your workflow's starting tasks. Hit "Run Workflow" and watch your automated agent execute step by step.
                    </Step>
                     <Step icon={<CodeBracketIcon className="w-6 h-6"/>} title="5. Analyze & Iterate">
                        Examine the final output and inspect the `Data Store` to see the result of each individual step. Use these insights to refine your SFL prompts or workflow logic and run again.
                    </Step>
                </div>
            </section>
        </div>
    );
};

export default Documentation;
