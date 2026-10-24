import { createContext, use } from 'react';
import { Link } from 'react-router';
import { Index, Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';
import { useUserId } from '../../features/identity';
import { useRoomChannel } from '../../features/roomChannel';
import { useCableActions } from '../../cable';
import { MESSAGES } from '../../features/messages';
import { describe } from '../../features/refusals';
import { GameShow } from '../Game';
import { UserShow } from '../User';
import { ROOM_STATUS, VISIBILITY } from '../../features/labels';

const roomContext = createContext(null);
export const useRoom = () => use(roomContext).data;
export const useRoomMeta = () => use(roomContext).meta;

export const roomScope = createScope(client, { endpoint: '/rooms', method: 'all' });

function RoomRow() {
  const { id, codeLabel, visibility, status } = useRoom();
  return (
    <li className="flex justify-between gap-2 py-1 border-b border-paper-dark">
      <Link
        to={`/salons/${id}`}
        className="underline-offset-4 hover:underline">
        {codeLabel}
      </Link>
      <span className="text-ink-soft text-sm">
        {VISIBILITY[visibility]}, {ROOM_STATUS[status]}
      </span>
    </li>
  );
}

// Un joueur, par son id (les relations ne suivent pas la synchronisation de spraypaint,
// les attributs si : on part de host.id, fixe, et de guest_id).
function Player({ id, present }) {
  if (!id) return '—';
  return (
    <>
      <UserShow id={id} />
      {!present.includes(String(id)) && ' (absent)'}
    </>
  );
}

const DEALS = {
  random: 'distribution au hasard',
  inverse: 'jeux inversés',
  fifty: 'autant de noirs que de blancs',
  max: 'maximum de noirs / de blancs',
  draft: 'pioche',
};

function Settings() {
  const { dealMethod, allowMultiple, imposedColor } = useRoom();
  const variants = [allowMultiple && 'motif multiple', imposedColor && 'pion imposé'];
  return [DEALS[dealMethod], ...variants].filter(Boolean).join(', ');
}

// Messages prédéfinis : les derniers reçus, et les boutons pour les joueurs.
function Messages({ code, isPlayer, messages }) {
  const { perform } = useCableActions();
  const say = (message) => perform({ channel: 'RoomChannel', code }, 'say', { message });
  return (
    <div className="flex flex-col gap-1">
      {messages.map(({ userId, code: message }, i) => (
        <p key={i}>
          <UserShow id={userId} /> : {MESSAGES[message]}
        </p>
      ))}
      {isPlayer && (
        <details>
          <summary className="cursor-pointer text-sm text-ink-soft">Messages</summary>
          <div className="flex flex-wrap gap-1 pt-1">
            {Object.entries(MESSAGES).map(([message, text]) => (
              <button
                key={message}
                className="btn text-sm px-2 py-0.5"
                onClick={() => say(message)}>
                {text}
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function RoomDetail() {
  const { id, codeLabel, status, host, guestId, score, imposedColor, errors } = useRoom();
  const { modify, committing } = useRoomMeta();
  const userId = useUserId();
  const { present, viewers, gameId, messages = [] } = useRoomChannel(id);
  const isPlayer = userId && [host?.id, guestId].map(String).includes(userId);
  const canJoin = userId && status === 'waiting' && !isPlayer;
  // Écriture immédiate : une transition, envoyée tout de suite.
  const change = (changes) => modify(changes, { delay: 0 });
  return (
    <section className="flex flex-col gap-2">
      <header className="flex flex-col gap-1">
        <h2 className="title text-lg">{codeLabel}</h2>
        <p className="text-sm text-ink-soft">
          Salon {ROOM_STATUS[status]} · <Settings /> · {viewers} spectateur{viewers > 1 ? 's' : ''}
        </p>
        <p>
          <Player
            id={host?.id}
            present={present}
          />{' '}
          contre{' '}
          <Player
            id={guestId}
            present={present}
          />
          {score && ` — ${score.host} à ${score.guest}`}
        </p>
      </header>
      <div className="flex gap-2">
        {canJoin && (
          <button
            className="btn"
            disabled={committing}
            onClick={() => change({ guestId: Number(userId) })}>
            Rejoindre
          </button>
        )}
        {isPlayer && status !== 'closed' && (
          <button
            className="btn"
            disabled={committing}
            onClick={() => change({ status: 'closed' })}>
            Fermer
          </button>
        )}
      </div>
      {Object.values(errors ?? {}).map((error) => (
        <p
          key={error.attribute}
          className="text-red-700">
          {describe(error).message}
        </p>
      ))}
      <Messages
        code={id}
        isPlayer={isPlayer && status !== 'closed'}
        messages={messages}
      />
      {gameId && (
        <GameShow
          id={gameId}
          me={userId}
          hostId={String(host?.id)}
          guestId={guestId && String(guestId)}
          roomCode={id}
          imposedColor={imposedColor}
          opponentAbsent={[host?.id, guestId].some(
            (p) => p && String(p) !== userId && !present.includes(String(p))
          )}
        />
      )}
    </section>
  );
}

const variants = { row: RoomRow, detail: RoomDetail };

const RoomController = ({ deleted, variant = 'row' }) => {
  const View = variants[variant];
  return deleted ? null : <View />;
};

export const Room = Watch(client, RoomController, roomContext);

// Salons listés : publics, et en cours (pour les spectateurs).
export const RoomIndex = (props) => (
  <Index
    scope={roomScope}
    Obs={Room}
    shouldRefresh={(action, { type }) => action === 'create' && type === 'rooms'}
    {...props}
  />
);

// Un salon, par son code (aussi les salons privés, accessibles par leur lien).
export const RoomShow = ({ code, ...props }) => (
  <Show
    key={code}
    scope={roomScope}
    request={{ method: 'find', id: code, includes: ['host'] }}
    Obs={Room}
    variant="detail"
    {...props}
  />
);
