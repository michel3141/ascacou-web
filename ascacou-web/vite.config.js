import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from 'unocss/vite';

// En dev, l'API et le cable passent par le proxy de vite : même origine que le front,
// donc ni CORS ni URL d'API à configurer. Le back de dev tourne sur l'hôte (port 3000) ;
// il n'accepte que localhost dans l'en-tête Host (sinon 403).
const api = {
  target: process.env.API_TARGET ?? 'http://host.docker.internal:3000',
  headers: { host: 'localhost:3000' },
};

export default defineConfig({
  plugins: [react(), UnoCSS()],
  server: {
    port: 5173,
    proxy: {
      '/api': api,
      '/cable': { ...api, ws: true },
    },
  },
});
