import { createContext, use, useState } from 'react';
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

function Hand({ label, cards, score, realized }) {
  return (
    <div className="flex flex-col gap-1">
      <p>
        {label} : {score ?? 0}
      </p>
      <div className="flex flex-wrap gap-1">
        {cards.map((card) => (
          <Card
            key={card}
            value={card}
            realized={realized?.includes(card)}
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
      <div className="flex flex-wrap gap-1">
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
            className="border px-3 py-1"
            onClick={() => pick(mine)}>
            Dans mon jeu
          </button>
          <button
            className="border px-3 py-1"
            onClick={() => pick(theirs)}>
            Dans le sien
          </button>
        </div>
      )}
    </div>
  );
}

function GameView({ me, hostId, guestId, roomCode, opponentAbsent }) {
  const game = useGame();
  const { modify } = useGameMeta();
  const { playMove, nextGame } = useGameActions();
  const [color, setColor] = useState('black');
  const [error, setError] = useState(null);
  const { mine, theirs } = roles({ me, hostId, guestId });
  const myTurn = Boolean(mine) && String(game.currentPlayerId) === me;
  const onError = (e) => setError(e.message);
  const playing = game.status === 'playing';
  const allowed = game.requiredColor ? [game.requiredColor] : Object.keys(COLORS);
  const current = allowed.includes(color) ? color : allowed[0];
  const rank = game.board.replace(/[^bw]/g, '').length + 1;

  const play = (coord) => {
    setError(null);
    playMove({ gameId: game.id, rank, coord, color: current }).unwrap().catch(onError);
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
      <h3 className="text-lg">
        Partie {game.number}
        {game.status === 'finished' &&
          ` — ${game.result === 'draw' ? 'nulle' : `gagnée par ${game.result === mine ? 'vous' : game.result === 'host' ? "l'hôte" : "l'invité"}`}`}
      </h3>
      <Hand
        label={handLabel('host', mine)}
        cards={game.hostHand}
        score={game.score?.host}
        realized={game.realizedPatterns}
      />
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
          color={current}
          onPlay={playing && myTurn ? play : undefined}
        />
      )}
      <Hand
        label={handLabel('guest', mine)}
        cards={game.guestHand}
        score={game.score?.guest}
        realized={game.realizedPatterns}
      />
      {playing && <p>{myTurn ? 'À vous de jouer.' : mine ? "À l'adversaire de jouer." : ''}</p>}
      {playing && myTurn && (
        <div className="flex gap-2">
          {allowed.map((c) => (
            <button
              key={c}
              className={`border px-3 py-1 ${c === current ? 'border-2 border-black' : ''}`}
              onClick={() => setColor(c)}>
              {COLORS[c]}
            </button>
          ))}
        </div>
      )}
      {mine && game.status !== 'finished' && (
        <div className="flex gap-2">
          <button
            className="border px-3 py-1"
            onClick={() => change({ result: theirs })}>
            Abandonner
          </button>
          {opponentAbsent && (
            <button
              className="border px-3 py-1"
              onClick={() => change({ result: mine })}>
              Réclamer la victoire
            </button>
          )}
        </div>
      )}
      {mine && game.status === 'finished' && (
        <button
          className="border px-3 py-1"
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
