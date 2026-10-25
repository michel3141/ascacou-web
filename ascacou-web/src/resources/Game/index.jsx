import { createContext, use, useEffect, useRef, useState } from 'react';
import { Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';
import { useGameActions } from '../../features/game';
import { MESSAGES } from '../../features/messages';
import { BarAction, ConfirmAction, FlagIcon, TopBarActions, UndoIcon } from '../../TopBar';
import { UserShow } from '../User';
import useNotifyErrors from '../../features/notices/useNotifyErrors';
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

// Message prédéfini reçu, affiché quelques secondes près du nom de son auteur (sans
// déplacer le plateau).
const BUBBLE_MS = 4000;

function Bubble({ message }) {
  const [visible, setVisible] = useState(() => Date.now() - message.at < BUBBLE_MS);
  useEffect(() => {
    const left = BUBBLE_MS - (Date.now() - message.at);
    if (left <= 0) return undefined;
    const timer = setTimeout(() => setVisible(false), left);
    return () => clearTimeout(timer);
  }, [message.at]);
  if (!visible) return null;
  return (
    <span className="rounded-lg bg-pearl border border-ink-faint px-2 text-sm">
      {MESSAGES[message.code]}
    </span>
  );
}

// Bandeau d'un joueur, au-dessus ou au-dessous du plateau (comme les pendules de
// lichess) : son nom, en encre pleine quand c'est à lui d'agir ; absent ; ses motifs.
function PlayerStrip({ id, mine, active, present, score, message }) {
  return (
    <div
      data-active={active || undefined}
      className="flex items-center gap-2 min-h-7">
      <span className={`rounded-md px-2 py-0.5 ${active ? 'bg-ink text-pearl' : 'text-ink-soft'}`}>
        {id ? <UserShow id={id} /> : '—'}
        {mine && ' (vous)'}
      </span>
      {id && !present && <span className="text-sm text-ink-faint">absent</span>}
      {message && (
        <Bubble
          key={message.at}
          message={message}
        />
      )}
      <span className="ml-auto text-sm">
        {score ?? 0} motif{score > 1 ? 's' : ''}
      </span>
    </div>
  );
}

function Hand({ cards, realized, flashing, onFocus }) {
  return (
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
  );
}

// Pioche : à son tour, le joueur place une carte libre dans l'un des deux jeux.
function Draft({ game, myTurn, mine, theirs }) {
  const { pickCard } = useGameActions();
  const [selected, setCard] = useState(null);
  // La carte choisie ne vaut que pour son tour (sinon : « Ce n'est pas à vous »).
  const card = myTurn ? selected : null;
  const full = (hand) => (hand === 'host' ? game.hostHand : game.guestHand).length >= 8;
  const free = ALL_CARDS.filter((c) => !game.hostHand.includes(c) && !game.guestHand.includes(c));
  const pick = (hand) => pickCard({ gameId: game.id, card, hand }).then(() => setCard(null));
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
            disabled={full(mine)}
            onClick={() => pick(mine)}>
            Dans mon jeu
          </button>
          <button
            className="btn"
            disabled={full(theirs)}
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

// Choix d'une couleur par des pions, comme sur le plateau ; le choix en cours est
// entouré de gris. Sans onChange : grisé (c'est à l'adversaire de choisir).
function PawnChoice({ label, colors, value, onChange }) {
  return (
    <div className={`flex items-center gap-3 ${onChange ? '' : 'opacity-30'}`}>
      <span className="text-sm text-ink-soft">{label}</span>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={COLORS[c]}
          aria-pressed={c === value}
          disabled={!onChange}
          onClick={() => onChange(c)}
          className={`size-9 rounded-full ${c === value ? 'outline-3 outline-ink-faint outline-offset-2' : ''}`}>
          <svg
            viewBox="0 0 20 20"
            className="size-full">
            <circle
              cx="10"
              cy="10"
              r="9"
              className={c === 'black' ? 'fill-ink' : 'fill-pearl stroke-ink-faint'}
              strokeWidth="0.5"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function GameView({
  me,
  hostId,
  guestId,
  roomCode,
  roomClosed,
  present = [],
  messages = [],
  imposedColor,
}) {
  const game = useGame();
  const { modify, error: saveError } = useGameMeta();
  const { playMove, acceptTakeback, nextGame } = useGameActions();
  const [color, setColor] = useState('black');
  const [nextColor, setNextColor] = useState('black');
  const { mine, theirs } = roles({ me, hostId, guestId });
  const myTurn = Boolean(mine) && String(game.currentPlayerId) === me;
  const opponentId = mine === 'host' ? guestId : hostId;
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
  const ids = { host: hostId, guest: guestId };
  const opponentAbsent = Boolean(mine) && !present.includes(ids[theirs]);
  // Refus d'une transition (abandon, annulation…) : notifiés, pas affichés en bas.
  useNotifyErrors(game.errors, saveError);
  const lastMessage = (id) => messages.findLast((m) => m.userId === id);
  const hand = (role) => (
    <Hand
      cards={role === 'host' ? game.hostHand : game.guestHand}
      realized={realized}
      flashing={flashed.map(({ pattern }) => pattern)}
      onFocus={setFocused}
    />
  );
  const strip = (role) => (
    <PlayerStrip
      id={ids[role]}
      mine={role === mine}
      active={game.status !== 'finished' && String(game.currentPlayerId) === ids[role]}
      present={present.includes(ids[role])}
      score={game.score?.[role]}
      message={lastMessage(ids[role])}
    />
  );
  const winner =
    game.result === 'draw' ? null : game.result === mine ? (
      'vous'
    ) : (
      <UserShow id={ids[game.result]} />
    );
  // Raison de la fin (end_reason), dite du point de vue du perdant : un abandon (drapeau,
  // ou fermeture du salon, qui fait abandonner la partie en cours), ou une victoire
  // réclamée face à un absent. Rien pour une fin aux motifs.
  const loserRole = { host: 'guest', guest: 'host' }[game.result];
  const loser = loserRole === mine ? 'vous' : loserRole && <UserShow id={ids[loserRole]} />;
  const endReason = {
    resign: roomClosed ? (
      <>
        {loser} {loserRole === mine ? 'avez' : 'a'} fermé le salon
      </>
    ) : (
      <>
        {loser} {loserRole === mine ? 'avez' : 'a'} abandonné
      </>
    ),
    claim: (
      <>
        victoire réclamée, {loser} {loserRole === mine ? 'étiez' : 'était'} absent
      </>
    ),
  }[game.endReason];

  const play = (coord) => {
    const imposed = imposedColor ? { nextColor } : {};
    playMove({ gameId: game.id, rank, coord, color: current, ...imposed });
  };
  const accept = () => {
    acceptTakeback({ gameId: game.id });
  };
  const change = (changes) => {
    modify(changes, { delay: 0 });
  };
  const next = () => {
    nextGame({ roomCode });
  };

  // Contre le plateau, du côté du joueur qui doit agir : le choix de couleur (actif pour
  // soi, grisé pour l'adversaire), la réponse à une demande d'annulation, le résultat.
  // Les deux emplacements gardent leur hauteur : le plateau ne bouge pas.
  const activeRole = [top, bottom].find((role) => String(game.currentPlayerId) === ids[role]);
  const slot = (role) => {
    if (game.status === 'finished')
      return role === bottom ? (
        <>
          <p className="flex flex-col items-center leading-tight">
            <span className="title">
              Partie {game.number} : {winner ? <>gagnée par {winner}</> : 'nulle'}
            </span>
            {endReason && <span className="text-sm text-ink-soft">{endReason}</span>}
          </p>
          {mine && !roomClosed && (
            <button
              className="btn"
              disabled={opponentAbsent}
              title={opponentAbsent ? "Votre adversaire n'est pas là" : undefined}
              onClick={next}>
              Partie suivante
            </button>
          )}
        </>
      ) : null;
    if (!playing || role !== activeRole) return null;
    const acting = role === mine;
    if (game.takebackRequested)
      return acting ? (
        <>
          <span className="text-sm">Annuler son coup ?</span>
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
        </>
      ) : (
        <span className="text-sm text-ink-soft">Annulation demandée…</span>
      );
    if (choosingOpening)
      return (
        <PawnChoice
          label="Premier pion"
          colors={Object.keys(COLORS)}
          onChange={acting ? (c) => change({ openingColor: c }) : undefined}
        />
      );
    return (
      <>
        <PawnChoice
          label={acting ? 'Votre pion' : 'Son pion'}
          colors={allowed}
          value={acting ? current : undefined}
          onChange={acting ? setColor : undefined}
        />
        {acting && imposedColor && (
          <PawnChoice
            label="Imposé"
            colors={Object.keys(COLORS)}
            value={nextColor}
            onChange={setNextColor}
          />
        )}
      </>
    );
  };
  const slotRow = (role) => (
    <div className="h-11 flex items-center justify-center gap-6">{slot(role)}</div>
  );

  return (
    <section className="flex flex-col gap-2">
      {mine && game.status !== 'finished' && (
        <TopBarActions>
          <BarAction
            icon={<UndoIcon />}
            label={game.takebackRequested ? 'Annulation demandée' : 'Annuler mon coup'}
            disabled={!playing || myTurn || rank === 1 || game.takebackRequested}
            onClick={() => change({ takebackRequested: true })}
          />
          <ConfirmAction
            icon={<FlagIcon />}
            label="Abandonner la partie"
            question="Abandonner ?"
            onConfirm={() => change({ result: theirs })}
          />
        </TopBarActions>
      )}
      {strip(top)}
      {hand(top)}
      {slotRow(top)}
      {game.status === 'drafting' ? (
        <Draft
          game={game}
          myTurn={myTurn}
          mine={mine}
          theirs={theirs}
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
      {slotRow(bottom)}
      {hand(bottom)}
      {strip(bottom)}
      {/* Actions secondaires et erreurs : sous son jeu, sans déplacer le plateau. */}
      <div className="flex flex-wrap gap-x-4 text-sm text-ink-soft">
        {playing && myTurn && rank === 1 && String(game.firstPlayerId) === me && (
          <button
            className="underline underline-offset-4"
            onClick={() => change({ firstPlayerId: Number(opponentId) })}>
            Laisser commencer l'adversaire
          </button>
        )}
        {opponentAbsent && game.status !== 'finished' && (
          <button
            className="underline underline-offset-4"
            onClick={() => change({ result: mine })}>
            Réclamer la victoire (adversaire absent)
          </button>
        )}
      </div>
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
