import { createContext, use, useEffect, useRef, useState } from 'react';
import { Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';
import { useGameActions } from '../../features/game';
import { describe } from '../../features/refusals';
import Board from './Board';
import Card from './Card';

const gameContext = createContext(null);
export const useGame = () => use(gameContext).data;
export const useGameMeta = () => use(gameContext).meta;

const gameScope = createScope(client, { endpoint: '/games', method: 'find' });

const COLORS = { black: 'Noir', white: 'Blanc' };
const ALL_CARDS = [...Array(16).keys()];

// Joueur de la partie : son rôle (host / guest) et son adversaire, ou rien (spectateur).
function roles({ me, hostId, guestId }) {
  if (me === hostId) return { mine: 'host', theirs: 'guest' };
  if (me === guestId) return { mine: 'guest', theirs: 'host' };
  return {};
}

const handLabel = (hand, mine) =>
  hand === mine
    ? 'Votre jeu'
    : mine
      ? 'Jeu adverse'
      : hand === 'host'
        ? "Jeu de l'hôte"
        : "Jeu de l'invité";

function Hand({ label, cards, score, realized, flashing, onFocus }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex justify-between">
        <span className="title text-sm">{label}</span>
        <span>
          {score ?? 0} motif{score > 1 ? 's' : ''}
        </span>
      </p>
      <div className="grid grid-cols-8 gap-1">
        {cards.map((card) => (
          <Card
            key={card}
            value={card}
            realized={realized?.includes(card)}
            flash={flashing?.includes(card)}
            onFocus={realized?.includes(card) ? onFocus : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// Pioche : à son tour, le joueur place une carte libre dans l'un des deux jeux.
function Draft({ game, myTurn, mine, theirs, onError }) {
  const { pickCard } = useGameActions();
  const [card, setCard] = useState(null);
  const free = ALL_CARDS.filter((c) => !game.hostHand.includes(c) && !game.guestHand.includes(c));
  const pick = (hand) =>
    pickCard({ gameId: game.id, card, hand })
      .unwrap()
      .then(() => setCard(null), onError);
  return (
    <div className="flex flex-col gap-2">
      <p>Pioche{myTurn ? ' : à vous de placer une carte' : ''}</p>
      <div className="grid grid-cols-8 gap-1">
        {free.map((c) => (
          <Card
            key={c}
            value={c}
            selected={c === card}
            onClick={myTurn ? () => setCard(c) : undefined}
          />
        ))}
      </div>
      {card !== null && (
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => pick(mine)}>
            Dans mon jeu
          </button>
          <button
            className="btn"
            onClick={() => pick(theirs)}>
            Dans le sien
          </button>
        </div>
      )}
    </div>
  );
}

// Carrés qui viennent d'être réalisés (absents de l'état précédent), le temps de
// l'animation. Rien au premier affichage : seul un coup pendant qu'on regarde compte.
const FLASH_MS = 1600;
const squareKey = ({ pattern, coord }) => `${pattern}@${coord}`;

function useFlash(squares) {
  const previous = useRef(null);
  const [flashed, setFlashed] = useState([]);
  const key = squares.map(squareKey).join(',');
  useEffect(() => {
    const known = previous.current;
    previous.current = new Set(squares.map(squareKey));
    if (!known) return undefined;
    const added = squares.filter((square) => !known.has(squareKey(square)));
    if (!added.length) return undefined;
    setFlashed(added);
    const timer = setTimeout(() => setFlashed([]), FLASH_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return flashed;
}

function ColorChoice({ label, colors, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{label} :</span>
      {colors.map((c) => (
        <button
          key={c}
          className={`btn ${c === value ? 'btn-on' : ''}`}
          onClick={() => onChange(c)}>
          {COLORS[c]}
        </button>
      ))}
    </div>
  );
}

function GameView({ me, hostId, guestId, roomCode, opponentAbsent, imposedColor }) {
  const game = useGame();
  const { modify } = useGameMeta();
  const { playMove, acceptTakeback, nextGame } = useGameActions();
  const [color, setColor] = useState('black');
  const [nextColor, setNextColor] = useState('black');
  const [error, setError] = useState(null);
  const { mine, theirs } = roles({ me, hostId, guestId });
  const myTurn = Boolean(mine) && String(game.currentPlayerId) === me;
  const opponentId = mine === 'host' ? guestId : hostId;
  const onError = (e) => setError(e.message);
  const playing = game.status === 'playing';
  const allowed = game.requiredColor ? [game.requiredColor] : Object.keys(COLORS);
  const current = allowed.includes(color) ? color : allowed[0];
  const rank = game.board.replace(/[^bw]/g, '').length + 1;
  const choosingOpening = playing && game.awaitingOpeningColor;
  // Son propre jeu en bas, celui de l'adversaire en haut (spectateur : l'hôte en haut).
  const [top, bottom] = mine === 'host' ? ['guest', 'host'] : ['host', 'guest'];
  const squares = game.realizedSquares ?? [];
  const realized = squares.map(({ pattern }) => pattern);
  // Carte survolée (ou touchée) : son carré s'entoure sur le plateau.
  const [focused, setFocused] = useState(null);
  const flashed = useFlash(squares);
  const shown = [
    ...squares.filter(({ pattern }) => pattern === focused),
    ...flashed.map((square) => ({ ...square, flash: true })),
  ];
  const hand = (role) => (
    <Hand
      label={handLabel(role, mine)}
      cards={role === 'host' ? game.hostHand : game.guestHand}
      score={game.score?.[role]}
      realized={realized}
      flashing={flashed.map(({ pattern }) => pattern)}
      onFocus={setFocused}
    />
  );

  const play = (coord) => {
    setError(null);
    const imposed = imposedColor ? { nextColor } : {};
    playMove({ gameId: game.id, rank, coord, color: current, ...imposed })
      .unwrap()
      .catch(onError);
  };
  const accept = () => {
    setError(null);
    acceptTakeback({ gameId: game.id }).unwrap().catch(onError);
  };
  const change = (changes) => {
    setError(null);
    modify(changes, { delay: 0 });
  };
  const next = () => {
    setError(null);
    nextGame({ roomCode }).unwrap().catch(onError);
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="title">
        Partie {game.number}
        {game.status === 'finished' &&
          ` — ${game.result === 'draw' ? 'nulle' : `gagnée par ${game.result === mine ? 'vous' : game.result === 'host' ? "l'hôte" : "l'invité"}`}`}
      </h3>
      {hand(top)}
      {game.status === 'drafting' ? (
        <Draft
          game={game}
          myTurn={myTurn}
          mine={mine}
          theirs={theirs}
          onError={onError}
        />
      ) : (
        <Board
          board={game.board}
          legalMoves={game.legalMoves}
          blockedCoords={game.blockedCoords}
          lastMove={game.lastMove}
          squares={shown}
          color={current}
          onPlay={
            playing && myTurn && !choosingOpening && !game.takebackRequested ? play : undefined
          }
        />
      )}
      {hand(bottom)}
      {playing && <p>{myTurn ? 'À vous de jouer.' : mine ? "À l'adversaire de jouer." : ''}</p>}
      {choosingOpening && myTurn && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Couleur du premier pion :</span>
          {Object.entries(COLORS).map(([c, label]) => (
            <button
              key={c}
              className="btn"
              onClick={() => change({ openingColor: c })}>
              {label}
            </button>
          ))}
        </div>
      )}
      {playing && myTurn && !choosingOpening && (
        <ColorChoice
          label="Votre pion"
          colors={allowed}
          value={current}
          onChange={setColor}
        />
      )}
      {playing && myTurn && !choosingOpening && imposedColor && (
        <ColorChoice
          label="Imposé à l'adversaire"
          colors={Object.keys(COLORS)}
          value={nextColor}
          onChange={setNextColor}
        />
      )}
      {playing &&
        myTurn &&
        rank === 1 &&
        game.firstPlayerId &&
        String(game.firstPlayerId) === me && (
          <button
            className="btn"
            onClick={() => change({ firstPlayerId: Number(opponentId) })}>
            Laisser commencer l'adversaire
          </button>
        )}
      {playing && mine && game.takebackRequested && !myTurn && <p>Annulation demandée.</p>}
      {playing && mine && game.takebackRequested && myTurn && (
        <div className="flex flex-wrap items-center gap-2">
          <span>L'adversaire demande à annuler son coup.</span>
          <button
            className="btn"
            onClick={accept}>
            Accepter
          </button>
          <button
            className="btn"
            onClick={() => change({ takebackRequested: false })}>
            Refuser
          </button>
        </div>
      )}
      {playing && mine && !myTurn && rank > 1 && !game.takebackRequested && (
        <button
          className="btn"
          onClick={() => change({ takebackRequested: true })}>
          Annuler mon coup
        </button>
      )}
      {mine && game.status !== 'finished' && (
        <div className="flex gap-2">
          <button
            className="btn"
            onClick={() => change({ result: theirs })}>
            Abandonner
          </button>
          {opponentAbsent && (
            <button
              className="btn"
              onClick={() => change({ result: mine })}>
              Réclamer la victoire
            </button>
          )}
        </div>
      )}
      {mine && game.status === 'finished' && (
        <button
          className="btn"
          onClick={next}>
          Partie suivante
        </button>
      )}
      {error && <p className="text-red-700">{error}</p>}
      {Object.values(game.errors ?? {}).map((e) => (
        <p
          key={e.attribute}
          className="text-red-700">
          {describe(e).message}
        </p>
      ))}
    </section>
  );
}

const GameController = ({ deleted, ...props }) => (deleted ? null : <GameView {...props} />);

export const Game = Watch(client, GameController, gameContext);

// La partie en cours d'un salon, par son id.
export const GameShow = ({ id, ...props }) => (
  <Show
    key={id}
    scope={gameScope}
    request={{ id }}
    Obs={Game}
    {...props}
  />
);
