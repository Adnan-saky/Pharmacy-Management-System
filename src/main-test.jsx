import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

console.log('main.jsx is executing!');

function TestApp() {
    console.log('TestApp is rendering!');
    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
            <h1 style={{ color: '#333' }}>Test - React is Working!</h1>
            <p>If you see this, React is loading correctly.</p>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
console.log('Root created, about to render...');
root.render(
    <StrictMode>
        <TestApp />
    </StrictMode>,
);
console.log('Render called!');
