// Carte-motif, comme dans la boîte : un carré de papier à un coin arrondi (en bas à
// gauche, comme le plateau), quatre pions en 2x2. Valeur 0..15, bits HG HD BG BD (noir 0, blanc 1).
// `realized` : le motif est présent sur le plateau (realized_patterns du serveur).
const SPOTS = [
  [8, 11, 11],
  [4, 29, 11],
  [2, 11, 29],
  [1, 29, 29],
];

export default function Card({ value, onClick, selected, realized, flash, onFocus }) {
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
          d="M0 0h40v40H10A10 10 0 0 1 0 30z"
          className={realized ? 'fill-paper-dark' : 'fill-paper'}
          stroke={selected || realized ? 'currentColor' : 'none'}
          strokeWidth={selected ? 3 : 2}
        />
        {SPOTS.map(([bit, cx, cy]) => (
          <circle
            key={bit}
            cx={cx}
            cy={cy}
            r="7"
            className={value & bit ? 'fill-pearl' : 'fill-ink'}
          />
        ))}
      </svg>
    </button>
  );
}
