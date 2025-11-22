
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Lightweight runtime checks and logging to help debug blank white screen.
console.log('[startup] main.tsx loaded');

const rootEl = document.getElementById('root');
if (!rootEl) {
	// If the root element is missing, write an obvious error to the document
	document.body.innerHTML = '<pre style="color:crimson">Error: root element (#root) not found.</pre>';
	throw new Error('root element (#root) not found');
}

const root = createRoot(rootEl);
try {
	root.render(<App />);
	console.log('[startup] React render called');
} catch (err) {
	console.error('[startup] React render failed', err);
	document.body.innerHTML = `<pre style="color:crimson">Application failed to start. See console for details.\n\n${String(err)}</pre>`;
}

// Global error handler to display uncaught errors plainly on the page for debugging.
window.addEventListener('error', (ev) => {
	console.error('[window error]', ev.error || ev.message, ev);
	const msg = ev.error ? ev.error.toString() : ev.message;
	// Avoid overwriting successful UI unless it's blank
	if (!document.getElementById('root') || document.getElementById('root')!.innerHTML.trim() === '') {
		document.body.innerHTML = `<pre style="color:crimson">Uncaught error: ${msg}</pre>`;
	}
});
