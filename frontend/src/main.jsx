import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { registerOfflineSupport } from './services/offlineSupport.js';
import './styles.css';

registerOfflineSupport();

const initialLoader = document.getElementById('initial-loader');
const loaderStartedAt = performance.now();
let loaderFinished = false;

function finishInitialLoader() {
  if (!initialLoader || loaderFinished) return;
  loaderFinished = true;

  const minimumDisplayTime = 900;
  const remainingTime = Math.max(0, minimumDisplayTime - (performance.now() - loaderStartedAt));

  window.setTimeout(() => {
    initialLoader.classList.add('is-complete');
    window.setTimeout(() => {
      initialLoader.classList.add('is-hidden');
      window.setTimeout(() => initialLoader.remove(), 300);
    }, 300);
  }, remainingTime);
}

if (document.readyState === 'complete') {
  finishInitialLoader();
} else {
  window.addEventListener('load', finishInitialLoader, { once: true });
  window.setTimeout(finishInitialLoader, 5000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
