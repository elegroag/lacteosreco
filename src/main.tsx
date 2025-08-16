import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initStorage } from './services/storageAdapter';

(async () => {
  try {
    await initStorage();
  } catch (e) {
    console.warn('No se pudo inicializar el almacenamiento. Continuando...', e);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
})();
