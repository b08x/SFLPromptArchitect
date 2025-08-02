/**
 * @file Stats.tsx
 * @description This component displays a row of key statistics for the application,
 * such as the total number of prompts, available AI personas, and test coverage.
 * It is composed of multiple `StatCard` sub-components to present the data clearly.
 *
 * @requires react
 * @requires ./icons/ClipboardDocumentListIcon
 * @requires ./icons/UsersIcon
 * @requires ./icons/PresentationChartLineIcon
 * @requires ./icons/ClockIcon
 */

import React from 'react';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import UsersIcon from './icons/UsersIcon';
import PresentationChartLineIcon from './icons/PresentationChartLineIcon';
import ClockIcon from './icons/ClockIcon';

/**
 * @interface StatsProps
 * @description Defines the props for the `Stats` component.
 * @property {number} totalPrompts - The total number of prompts currently in the library.
 */
interface StatsProps {
    totalPrompts: number;
}

/**
 * @interface StatCardProps
 * @description Defines the props for the `StatCard` sub-component.
 * @property {React.ReactNode} icon - The icon element to display in the card.
 * @property {string} label - The text label describing the statistic.
 * @property {string | number} value - The value of the statistic to display.
 * @property {string} iconBgColor - The Tailwind CSS background color class for the icon container.
 */
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    iconBgColor: string;
}

/**
 * A reusable card component for displaying a single statistic with an icon, label, and value.
 *
 * @param {StatCardProps} props - The props for the component.
 * @returns {JSX.Element} A styled card displaying a single piece of statistical data.
 * @private
 */
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconBgColor }) => {
    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );
};

/**
 * The main statistics component that displays a grid of `StatCard` components.
 * It provides a high-level overview of the prompt library's status.
 * Note: Some values like "AI Personas" and "Test Coverage" are currently hardcoded for demonstration.
 *
 * @param {StatsProps} props - The props for the component, including the total number of prompts.
 * @returns {JSX.Element} The rendered grid of statistics cards.
 */
const Stats: React.FC<StatsProps> = ({ totalPrompts }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard 
                icon={<ClipboardDocumentListIcon className="w-6 h-6 text-blue-600"/>} 
                label="Total Prompts" 
                value={totalPrompts}
                iconBgColor="bg-blue-100"
            />
            <StatCard 
                icon={<UsersIcon className="w-6 h-6 text-indigo-600"/>} 
                label="AI Personas" 
                value={8} // Note: This is currently a static value.
                iconBgColor="bg-indigo-100"
            />
            <StatCard 
                icon={<PresentationChartLineIcon className="w-6 h-6 text-green-600"/>} 
                label="Test Coverage" 
                value="87%" // Note: This is currently a static value.
                iconBgColor="bg-green-100"
            />
            <StatCard 
                icon={<ClockIcon className="w-6 h-6 text-amber-600"/>} 
                label="Last Tested" 
                value="2h ago" // Note: This is currently a static value.
                iconBgColor="bg-amber-100"
            />
        </div>
    );
};

export default Stats;
