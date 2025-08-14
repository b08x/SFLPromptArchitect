/**
 * @file index.tsx
 * @description This is the main entry point for the SFL Prompt Studio React application.
 * It identifies the root DOM element in the `index.html` file and uses `ReactDOM.createRoot`
 * to render the main `App` component into it. The application is wrapped in `React.StrictMode`
 * to enable additional checks and warnings during development.
 *
 * @requires react
 * @requires react-dom/client
 * @requires ./App
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * The root DOM element where the React application will be mounted.
 * @constant {HTMLElement}
 */
const rootElement = document.getElementById('root');

// Ensure the root element exists before attempting to render the application.
if (!rootElement) {
  throw new Error("Fatal Error: Could not find the root element with ID 'root' in the DOM. The application cannot be mounted.");
}

/**
 * The root instance for the React application, created using the concurrent rendering API.
 * @constant {ReactDOM.Root}
 */
const root = ReactDOM.createRoot(rootElement);

// Render the top-level App component into the root.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
