// Plateau 5x5 : `board` = une ligne par rangée (`b` noir, `w` blanc, `.` vide) ; cases
// "LxC". Les cases jouables (legal_moves) sont proposées pour la couleur choisie.
const PIECES = { b: 'bg-black', w: 'bg-white border border-gray-500' };

export default function Board({ board, legalMoves, blockedCoords, color, onPlay }) {
  const rows = board.split('/');
  return (
    <div className="grid grid-cols-5 gap-1 aspect-square w-full bg-amber-100 p-1">
      {rows.flatMap((row, r) =>
        [...row].map((cell, c) => {
          const coord = `${r + 1}x${c + 1}`;
          const playable = onPlay && legalMoves?.[coord]?.includes(color);
          const blocked = blockedCoords?.includes(coord);
          return (
            <button
              key={coord}
              type="button"
              disabled={!playable}
              onClick={() => onPlay(coord)}
              className={`flex items-center justify-center ${playable ? 'bg-amber-200' : ''}`}>
              {cell !== '.' && <span className={`size-4/5 rounded-full ${PIECES[cell]}`} />}
              {blocked && <span className="size-1/3 rounded-full bg-green-600" />}
            </button>
          );
        })
      )}
    </div>
  );
}
