import { defineConfig, presetWind4 } from 'unocss';

// Charte du livret et de la boîte : papier, encre, blanc, une touche de vert.
// Papier, encre et blanc : ceux de la carte d'ascacou.com (favicon).
// Mobile d'abord.
export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      paper: { DEFAULT: '#e8d9c6', dark: '#e0d1be' }, // plateau, cartes
      ink: { DEFAULT: '#1d1d1b', soft: '#606060', faint: '#a0a0a0' }, // pions noirs, textes
      pearl: '#fff', // pions blancs
      green: '#309880', // pion vert (case où l'on ne peut plus jouer)
      alert: '#a33a2a', // erreurs : rouge brique, de la famille de l'encre
    },
    font: {
      sans: "'Outfit Variable', system-ui, sans-serif",
    },
  },
  shortcuts: {
    // Encadrés du livret : bord fin à l'encre, coins arrondis.
    btn: 'border border-ink rounded-lg px-3 py-1 bg-white text-ink active:bg-paper disabled:opacity-40',
    // Action principale de l'écran : blanc sur encre.
    'btn-primary': 'bg-ink text-pearl active:bg-ink-soft',
    // Choix en cours : le bouton reste noir sur blanc, entouré de gris.
    'btn-on': 'outline-3 outline-ink-faint outline-offset-1',
    title: 'uppercase font-black tracking-wide',
  },
});
