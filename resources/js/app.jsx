import React from 'react';
import { createRoot } from 'react-dom/client';
import './bootstrap';
import App from './src/App';

createRoot(document.getElementById('app')).render(<App />);
