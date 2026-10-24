import { defineConfig, presetWind4 } from 'unocss';

// Charte du livret et de la boîte : papier, encre, blanc, une touche de vert.
// Mobile d'abord.
export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      paper: { DEFAULT: '#e8d8c0', dark: '#e0d0b8' }, // plateau, cartes
      ink: { DEFAULT: '#181010', soft: '#606060', faint: '#a0a0a0' }, // pions noirs, textes
      pearl: '#f8f8f8', // pions blancs
      green: '#309880', // pion vert (case où l'on ne peut plus jouer)
    },
    font: {
      sans: "'Outfit Variable', system-ui, sans-serif",
    },
  },
  shortcuts: {
    // Encadrés du livret : bord fin à l'encre, coins arrondis.
    btn: 'border border-ink rounded-lg px-3 py-1 bg-white text-ink active:bg-paper disabled:opacity-40',
    'btn-on': 'bg-ink text-pearl',
    title: 'uppercase font-black tracking-wide',
  },
});
