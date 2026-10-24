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

function ColorChoice({ label, colors, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{label} :</span>
      {colors.map((c) => (
        <button
          key={c}
          className={`border px-3 py-1 ${c === value ? 'border-2 border-black' : ''}`}
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
          lastMove={game.lastMove}
          color={current}
          onPlay={
            playing && myTurn && !choosingOpening && !game.takebackRequested ? play : undefined
          }
        />
      )}
      <Hand
        label={handLabel('guest', mine)}
        cards={game.guestHand}
        score={game.score?.guest}
        realized={game.realizedPatterns}
      />
      {playing && <p>{myTurn ? 'À vous de jouer.' : mine ? "À l'adversaire de jouer." : ''}</p>}
      {choosingOpening && myTurn && (
        <div className="flex flex-wrap items-center gap-2">
          <span>Couleur du premier pion :</span>
          {Object.entries(COLORS).map(([c, label]) => (
            <button
              key={c}
              className="border px-3 py-1"
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
            className="border px-3 py-1"
            onClick={() => change({ firstPlayerId: Number(opponentId) })}>
            Laisser commencer l'adversaire
          </button>
        )}
      {playing && mine && game.takebackRequested && !myTurn && <p>Annulation demandée.</p>}
      {playing && mine && game.takebackRequested && myTurn && (
        <div className="flex flex-wrap items-center gap-2">
          <span>L'adversaire demande à annuler son coup.</span>
          <button
            className="border px-3 py-1"
            onClick={accept}>
            Accepter
          </button>
          <button
            className="border px-3 py-1"
            onClick={() => change({ takebackRequested: false })}>
            Refuser
          </button>
        </div>
      )}
      {playing && mine && !myTurn && rank > 1 && !game.takebackRequested && (
        <button
          className="border px-3 py-1"
          onClick={() => change({ takebackRequested: true })}>
          Annuler mon coup
        </button>
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
