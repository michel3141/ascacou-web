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
import ShareLink from '../../features/ShareLink';
import { UserShow } from '../User';
import { ROOM_STATUS, VISIBILITY } from '../../features/labels';
import { ConfirmAction, CrossIcon, TopBarActions } from '../../TopBar';

const roomContext = createContext(null);
export const useRoom = () => use(roomContext).data;
export const useRoomMeta = () => use(roomContext).meta;

export const roomScope = createScope(client, { endpoint: '/rooms', method: 'all' });

// Ligne d'un salon dans une liste de l'accueil : son code (lien), puis ses joueurs (en
// cours) ou son hôte et ses réglages (en attente). hideMine : dans les listes générales,
// ses propres salons sont déjà dans « Vos salons ».
function RoomRow({ hideMine }) {
  const { id, codeLabel, visibility, status, host, guestId } = useRoom();
  const userId = useUserId();
  if (hideMine && userId && [host?.id, guestId].map(String).includes(userId)) return null;
  return (
    <li className="flex justify-between gap-2 py-1 border-b border-paper-dark">
      <Link
        to={`/salons/${id}`}
        className="underline-offset-4 hover:underline">
        {codeLabel}
      </Link>
      <span className="text-ink-soft text-sm text-right">
        {status === 'playing' && guestId ? (
          <>
            {host && <UserShow id={host.id} />} contre <UserShow id={guestId} />
          </>
        ) : (
          <>
            {host && <UserShow id={host.id} />} · <Settings />
            {visibility === 'private' && ` · ${VISIBILITY.private}`}
          </>
        )}
      </span>
    </li>
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

// Messages prédéfinis, en bas de page (le plateau ne bouge pas) : les boutons pour les
// joueurs, et les derniers reçus (ils s'affichent aussi un instant près de leur auteur).
function Messages({ code, isPlayer, messages }) {
  const { perform } = useCableActions();
  const say = (message) => perform({ channel: 'RoomChannel', code }, 'say', { message });
  if (!isPlayer && !messages.length) return null;
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-ink-soft">Messages</summary>
      <div className="flex flex-col gap-2 pt-2">
        {isPlayer && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(MESSAGES).map(([message, text]) => (
              <button
                key={message}
                className="btn px-2 py-0.5"
                onClick={() => say(message)}>
                {text}
              </button>
            ))}
          </div>
        )}
        {messages.map(({ userId, code: message, at }) => (
          <p key={at}>
            <UserShow id={userId} /> : {MESSAGES[message]}
          </p>
        ))}
      </div>
    </details>
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
    <section className="flex flex-col gap-3">
      {isPlayer && status !== 'closed' && (
        <TopBarActions>
          <ConfirmAction
            icon={<CrossIcon />}
            label="Fermer le salon"
            className="order-last"
            question={
              gameId && status === 'playing' ? 'Fermer (partie perdue) ?' : 'Fermer le salon ?'
            }
            onConfirm={() => change({ status: 'closed' })}
          />
        </TopBarActions>
      )}
      {/* Le salon en deux lignes : son nom, puis les parties gagnées et ses réglages. */}
      <header className="text-sm">
        <h2 className="title">{codeLabel}</h2>
        <p className="text-ink-soft">
          {host && guestId ? (
            <>
              Parties : <UserShow id={host.id} /> {score?.host ?? 0} – {score?.guest ?? 0}{' '}
              <UserShow id={guestId} />
            </>
          ) : (
            `Salon ${ROOM_STATUS[status]}`
          )}
          {' · '}
          <Settings />
          {viewers > 0 && ` · ${viewers} spectateur${viewers > 1 ? 's' : ''}`}
        </p>
      </header>
      {status === 'waiting' && (
        <div className="flex flex-col gap-2">
          {canJoin && (
            <button
              className="btn btn-primary self-start"
              disabled={committing}
              onClick={() => change({ guestId: Number(userId) })}>
              Rejoindre
            </button>
          )}
          {isPlayer && (
            <>
              <p>En attente d'un adversaire : envoyez-lui le lien du salon.</p>
              <ShareLink
                url={window.location.href}
                title="Ascacou"
                text={`Une partie d'Ascacou ? Rejoignez-moi dans le salon « ${codeLabel} ».`}
              />
            </>
          )}
        </div>
      )}
      {status === 'closed' && <p className="text-ink-soft">Salon fermé.</p>}
      {Object.values(errors ?? {}).map((error) => (
        <p
          key={error.attribute}
          className="text-red-700">
          {describe(error).message}
        </p>
      ))}
      {gameId && (
        <GameShow
          id={gameId}
          me={userId}
          hostId={String(host?.id)}
          guestId={guestId && String(guestId)}
          roomCode={id}
          imposedColor={imposedColor}
          present={present}
          messages={messages}
        />
      )}
      <Messages
        code={id}
        isPlayer={isPlayer && status !== 'closed'}
        messages={messages}
      />
    </section>
  );
}

// Salon terminé : les joueurs et le score final, sans lien (rien à y faire, tant qu'on
// ne peut pas revoir les parties).
function ClosedRoomRow() {
  const { host, guestId, score } = useRoom();
  if (!guestId) return null; // fermé sans adversaire : pas de score à montrer
  return (
    <li className="flex justify-between gap-2 py-1 border-b border-paper-dark text-sm text-ink-soft">
      <span>
        {host && <UserShow id={host.id} />} {score?.host ?? 0} – {score?.guest ?? 0}{' '}
        {guestId ? <UserShow id={guestId} /> : '—'}
      </span>
    </li>
  );
}

const variants = { row: RoomRow, closed: ClosedRoomRow, detail: RoomDetail };

const RoomController = ({ deleted, variant = 'row', hideMine }) => {
  const View = variants[variant];
  return deleted ? null : <View hideMine={hideMine} />;
};

export const Room = Watch(client, RoomController, roomContext);

const refreshOnRooms = (action, { type }) => action === 'create' && type === 'rooms';

// Une liste de salons (accueil) : `where` filtre (status, visibility, player: 'me') ;
// tri par défaut du serveur, du plus récent au plus ancien. hideMine : sans les siens
// (déjà dans « Vos salons ») ; variant="closed" : salons terminés, en lecture seule.
export const RoomList = ({ where, per, ...props }) => (
  <Index
    scope={roomScope}
    Obs={Room}
    request={{ includes: ['host'], where, ...(per ? { per } : {}) }}
    shouldRefresh={refreshOnRooms}
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
