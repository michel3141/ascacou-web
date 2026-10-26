// Carte-motif, comme dans le livret : un carré de papier à un coin arrondi (en bas à
// gauche, comme le plateau), quatre pions en 2x2. Valeur 0..15, bits HG HD BG BD (noir 0, blanc 1).
// Proportions mesurées sur les cartes du livret (page « Règle du jeu à 2 ») : coin
// arrondi de 17 % du côté, pions de 26 % de diamètre centrés à 30 % et 70 %.
// `realized` : le motif est présent sur le plateau (realized_patterns du serveur).
// `empty` : place libre d'un jeu pendant la pioche (contour seul, sans pions).
const SPOTS = [
  [8, 11.9, 11.9],
  [4, 28.1, 11.9],
  [2, 11.9, 28.1],
  [1, 28.1, 28.1],
];
const PAWN_R = 5.3;

export default function Card({ value, onClick, selected, realized, flash, onFocus, empty }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      data-realized={realized || undefined}
      aria-pressed={selected || undefined}
      onPointerEnter={onFocus && (() => onFocus(value))}
      onPointerLeave={onFocus && (() => onFocus(null))}
      className={`block w-full aspect-square disabled:cursor-default ${flash ? 'card-flash' : ''}`}>
      <svg
        viewBox="-2 -2 44 44"
        className="size-full">
        <path
          d="M0 0h40v40H6.9A6.9 6.9 0 0 1 0 33.1z"
          className={
            empty ? 'fill-none stroke-ink-faint' : realized ? 'fill-paper-dark' : 'fill-paper'
          }
          stroke={empty ? undefined : selected || realized ? 'currentColor' : 'none'}
          strokeWidth={empty ? 1 : selected ? 3 : 2}
          strokeDasharray={empty ? '3 3' : undefined}
        />
        {!empty &&
          SPOTS.map(([bit, cx, cy]) => (
            <circle
              key={bit}
              cx={cx}
              cy={cy}
              r={PAWN_R}
              className={value & bit ? 'fill-pearl' : 'fill-ink'}
            />
          ))}
      </svg>
    </button>
  );
}
