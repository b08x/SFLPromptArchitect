/**
 * @file ModalShell.tsx
 * @description This component provides a reusable, styled wrapper for all modal dialogs in the application.
 * It handles the modal's open/close state, provides a background overlay, and includes a consistent header with a title and close button.
 * The size of the modal can be customized via props to accommodate different content needs.
 *
 * @requires react
 */

import React from 'react';

/**
 * @interface ModalShellProps
 * @description Defines the props for the `ModalShell` component.
 * @property {boolean} isOpen - Determines if the modal is visible. When `false`, the component returns `null`.
 * @property {() => void} onClose - Callback function to be invoked when the modal should be closed, typically triggered by the close button.
 * @property {string} title - The title to be displayed in the modal's header.
 * @property {React.ReactNode} children - The content to be rendered inside the modal's body.
 * @property {'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'} [size='xl'] - The maximum width of the modal, corresponding to Tailwind CSS max-width classes. Defaults to 'xl'.
 */
interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

/**
 * A reusable shell component for creating consistent modal dialogs across the application.
 * It provides the basic structure, styling, and behavior for a modal, including:
 * - A semi-transparent backdrop overlay.
 * - A centered container with a configurable maximum width.
 * - A header with a title and a close button.
 * - A scrollable content area for the modal's body.
 *
 * @param {ModalShellProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered modal component, or `null` if `isOpen` is `false`.
 *
 * @example
 * <ModalShell isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="My Modal">
 *   <p>This is the content of the modal.</p>
 * </ModalShell>
 */
const ModalShell: React.FC<ModalShellProps> = ({ isOpen, onClose, title, children, size = 'xl' }) => {
  if (!isOpen) return null;

  /**
   * @constant {Record<string, string>} sizeClasses
   * @description A mapping of size keys to their corresponding Tailwind CSS max-width classes.
   * @private
   */
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`bg-[#333e48] rounded-lg shadow-xl w-full ${sizeClasses[size]} flex flex-col max-h-[90vh] border border-[#5c6f7e]`}>
        <div className="flex items-center justify-between p-4 border-b border-[#5c6f7e]">
          <h3 id="modal-title" className="text-xl font-semibold text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#95aac0] hover:text-gray-200 transition-colors"
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
