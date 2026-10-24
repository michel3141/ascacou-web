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

const roomContext = createContext(null);
export const useRoom = () => use(roomContext).data;
export const useRoomMeta = () => use(roomContext).meta;

export const roomScope = createScope(client, { endpoint: '/rooms', method: 'all' });

function RoomRow() {
  const { id, codeLabel, visibility, status } = useRoom();
  return (
    <li>
      <Link to={`/salons/${id}`}>{codeLabel}</Link> — {visibility}, {status}
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
  return <p>{[DEALS[dealMethod], ...variants].filter(Boolean).join(', ')}</p>;
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
        <div className="flex flex-wrap gap-1">
          {Object.entries(MESSAGES).map(([message, text]) => (
            <button
              key={message}
              className="border px-2 py-0.5 text-sm"
              onClick={() => say(message)}>
              {text}
            </button>
          ))}
        </div>
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
      <h2 className="text-xl">{codeLabel}</h2>
      <p>Statut : {status}</p>
      <Settings />
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
      <p>Spectateurs : {viewers}</p>
      <div className="flex gap-2">
        {canJoin && (
          <button
            className="border px-3 py-1"
            disabled={committing}
            onClick={() => change({ guestId: Number(userId) })}>
            Rejoindre
          </button>
        )}
        {isPlayer && status !== 'closed' && (
          <button
            className="border px-3 py-1"
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
