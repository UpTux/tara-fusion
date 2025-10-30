/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    // Add more env variables here as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Declare module for raw file imports
declare module '*.template?raw' {
    const content: string;
    export default content;
}
