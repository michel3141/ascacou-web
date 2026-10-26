import { defineConfig, presetWind4 } from 'unocss';

// Charte du livret et de la boîte : les couleurs sont des variables CSS, déclarées
// dans src/index.css. Mobile d'abord.
export default defineConfig({
  presets: [presetWind4()],
  theme: {
    colors: {
      paper: { DEFAULT: 'var(--paper)', dark: 'var(--paper-dark)' },
      ink: { DEFAULT: 'var(--ink)', soft: 'var(--ink-soft)', faint: 'var(--ink-faint)' },
      pearl: 'var(--pearl)',
      green: 'var(--green)',
      alert: 'var(--alert)',
    },
    font: {
      sans: "'Outfit Variable', system-ui, sans-serif",
    },
  },
  shortcuts: {
    // Encadrés du livret : bord fin à l'encre, coins droits sauf un grand arrondi, en bas
    // à gauche comme celui des cartes et du plateau.
    box: 'border border-ink rounded-none rounded-bl-3xl',
    // Message prédéfini : le même aspect, à envoyer (bouton) ou reçu (bulle). Couleur et
    // graisse explicites : une bulle s'affiche dans le bandeau d'un joueur (encre inversée
    // quand c'est à lui de jouer).
    msg: 'rounded-lg border border-ink bg-pearl px-2.5 py-0.5 text-sm font-normal text-ink',
    // Le texte courant est léger (Silka Light dans le livret) ; les boutons gardent la
    // graisse normale, pour se distinguer du texte.
    btn: 'border border-ink rounded-lg px-3 py-1 bg-pearl text-ink font-normal active:bg-paper disabled:opacity-40',
    // Action principale de l'écran : blanc sur encre.
    'btn-primary': 'bg-ink text-pearl active:bg-ink-soft',
    // Choix en cours : le bouton reste noir sur blanc, entouré de gris.
    'btn-on': 'outline-3 outline-ink-faint outline-offset-1',
    title: 'uppercase font-black tracking-wide',
  },
});
