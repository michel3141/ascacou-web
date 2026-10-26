import { useState } from 'react';

// Partage d'un lien : la feuille de partage du téléphone (navigator.share), sinon copie
// dans le presse-papier, sinon le lien affiché à sélectionner. Les deux premiers
// demandent un contexte sécurisé (HTTPS ou localhost).
export default function ShareLink({ url, title, text, label = 'Partager le lien' }) {
  const [state, setState] = useState(null); // null | 'copied' | 'manual'
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error.name === 'AbortError') return; // partage annulé par le joueur
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      setState('manual');
    }
  };
  return (
    <span className="flex flex-wrap items-center gap-2">
      <button
        className="btn btn-primary"
        onClick={share}>
        {label}
      </button>
      {state === 'copied' && <span className="text-sm text-ink-soft">Lien copié.</span>}
      {state === 'manual' && (
        <input
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          className="flex-1 min-w-0 border border-ink-faint rounded-lg px-2 py-1 bg-pearl text-sm"
        />
      )}
    </span>
  );
}
