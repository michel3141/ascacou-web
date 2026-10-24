// Carte-motif : un carré 2x2. Valeur 0..15, bits HG HD BG BD (noir 0, blanc 1).
// `realized` : le motif est présent sur le plateau (realized_patterns du serveur).
const CELLS = [8, 4, 2, 1];

export default function Card({ value, onClick, selected, realized }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      data-realized={realized || undefined}
      className={`grid grid-cols-2 gap-px p-1 border ${selected ? 'border-red-600 border-2' : realized ? 'border-green-600 border-2' : 'border-gray-400'}`}>
      {CELLS.map((bit) => (
        <span
          key={bit}
          className={`size-3 border border-gray-500 ${value & bit ? 'bg-white' : 'bg-black'}`}
        />
      ))}
    </button>
  );
}
