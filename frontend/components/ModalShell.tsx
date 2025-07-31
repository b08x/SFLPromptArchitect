/**
 * @file ModalShell.tsx
 * @description This component provides a reusable, styled wrapper for all modal dialogs in the application.
 * It handles the modal's open/close state, provides a background overlay, and includes a consistent header with a title and close button.
 * The size of the modal can be customized via props.
 *
 * @requires react
 */

import React from 'react';

/**
 * @interface ModalShellProps
 * @description Defines the props for the ModalShell component.
 * @property {boolean} isOpen - Determines if the modal is visible.
 * @property {() => void} onClose - Callback function to be invoked when the modal should be closed (e.g., by clicking the close button or overlay).
 * @property {string} title - The title to be displayed in the modal's header.
 * @property {React.ReactNode} children - The content to be rendered inside the modal body.
 * @property {'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'} [size='xl'] - The maximum width of the modal. Defaults to 'xl'.
 */
interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

/**
 * A reusable shell component for creating modal dialogs.
 * It provides the basic structure, styling, and behavior for a modal,
 * including an overlay, a container, a header with a title and close button,
 * and a scrollable content area.
 *
 * @param {ModalShellProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component, or null if `isOpen` is false.
 */
const ModalShell: React.FC<ModalShellProps> = ({ isOpen, onClose, title, children, size = 'xl' }) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-60 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh]`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalShell;