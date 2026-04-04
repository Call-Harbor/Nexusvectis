import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Handle ToDesktop deep link auth callback via URL hash/search on app load
// When systemets browser redirects nexusvectis://auth?access_token=TOKEN,
// Electron will re-open the app with that URL. We catch the token here.
try {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  if (accessToken) {
    localStorage.setItem('base44_access_token', accessToken);
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
} catch (e) {
  // ignore
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)