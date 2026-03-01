import React from 'react'
import ReactDOM from 'react-dom/client'
import { MobileApp } from './MobileApp.tsx'
import '../src/index.css' // Import existing global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MobileApp />
    </React.StrictMode>,
)
