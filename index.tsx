// Fix: Import React, StrictMode, createRoot and App to resolve undefined variable errors.
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// This is a placeholder for the transpiled JS file.
// The actual file is index.html which includes the babel transpiler.
// In a real build setup, this .tsx file would be compiled.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
