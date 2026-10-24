// Plateau de la boîte : une surface de papier, un coin arrondi (en bas à gauche), les
// 25 positions marquées d'un point ; les pions se posent sur les points.
// `board` = une ligne par rangée (`b` noir, `w` blanc, `.` vide) ; positions "LxC".
// Positions jouables (legal_moves) pour la couleur choisie ; pions verts sur les
// positions où plus rien n'est jouable ; dernier pion posé (last_move) marqué.
// `squares` : carrés 2x2 à entourer ({ coord: case en haut à gauche, flash }) — celui
// d'une carte survolée, ou ceux qu'un coup vient de réaliser (qui s'effacent).
const STEP = 20;
const at = (i) => 10 + i * STEP;
const PIECES = { b: 'fill-ink', w: 'fill-pearl' };

// Contour d'un carré 2x2, de la forme d'une carte : droit, un coin arrondi en bas à gauche.
const SIDE = STEP + 19;
const RADIUS = 9.5;
const cardOutline = (x, y) =>
  `M${x} ${y}h${SIDE}v${SIDE}H${x + RADIUS}A${RADIUS} ${RADIUS} 0 0 1 ${x} ${y + SIDE - RADIUS}z`;

export default function Board({
  board,
  legalMoves,
  blockedCoords,
  lastMove,
  squares = [],
  color,
  onPlay,
}) {
  const rows = board.split('/');
  return (
    <svg
      viewBox="0 0 100 100"
      className="w-full aspect-square select-none">
      <path
        d="M0 0h100v100H12A12 12 0 0 1 0 88z"
        className="fill-paper"
      />
      {rows.flatMap((row, r) =>
        [...row].map((cell, c) => {
          const coord = `${r + 1}x${c + 1}`;
          const [x, y] = [at(c), at(r)];
          const playable = onPlay && legalMoves?.[coord]?.includes(color);
          const blocked = cell === '.' && blockedCoords?.includes(coord);
          const last = lastMove?.coord === coord;
          return (
            <g
              key={coord}
              data-coord={coord}
              data-playable={playable || undefined}
              onClick={playable ? () => onPlay(coord) : undefined}
              className={playable ? 'cursor-pointer' : undefined}>
              <circle
                cx={x}
                cy={y}
                r="0.9"
                className="fill-ink"
              />
              {playable && (
                <circle
                  cx={x}
                  cy={y}
                  r="6.5"
                  className={`${PIECES[color === 'black' ? 'b' : 'w']} opacity-0 hover:opacity-40 active:opacity-60`}
                />
              )}
              {blocked && (
                <circle
                  cx={x}
                  cy={y}
                  r="6.5"
                  className="fill-green"
                />
              )}
              {cell !== '.' && (
                <circle
                  data-last={last || undefined}
                  cx={x}
                  cy={y}
                  r="6.5"
                  className={PIECES[cell]}
                />
              )}
              {last && (
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  className={cell === 'b' ? 'fill-pearl' : 'fill-ink'}
                />
              )}
            </g>
          );
        })
      )}
      {squares.map(({ coord, flash }) => {
        const [r, c] = coord.split('x').map((n) => Number(n) - 1);
        return (
          <path
            key={`${coord}-${flash ? 'flash' : 'focus'}`}
            data-square={coord}
            d={cardOutline(at(c) - 9.5, at(r) - 9.5)}
            className={`fill-none stroke-ink pointer-events-none ${flash ? 'square-flash' : ''}`}
            strokeWidth="1.2"
          />
        );
      })}
    </svg>
  );
}
