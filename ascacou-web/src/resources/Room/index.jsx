import { createContext, use } from 'react';
import { Link, useNavigate } from 'react-router';
import { useRoomsActions } from '../../features/rooms';
import { Index, Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';
import { useUserId } from '../../features/identity';
import { useRoomChannel } from '../../features/roomChannel';
import { useCableActions } from '../../cable';
import { MESSAGES } from '../../features/messages';
import useNotifyErrors from '../../features/notices/useNotifyErrors';
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
          <div className="flex flex-wrap gap-2">
            {Object.entries(MESSAGES).map(([message, text]) => (
              <button
                key={message}
                className="msg active:bg-paper"
                onClick={() => say(message)}>
                {text}
              </button>
            ))}
          </div>
        )}
        {messages.map(({ userId, code: message, at }) => (
          <p
            key={at}
            className="flex items-center gap-2">
            <span className="text-ink-soft">
              <UserShow id={userId} />
            </span>
            <span className="msg">{MESSAGES[message]}</span>
          </p>
        ))}
      </div>
    </details>
  );
}

// Salon fermé : le bilan, et la suite (un nouveau salon aux mêmes réglages pour
// réinviter l'adversaire, ou l'accueil). La dernière partie reste visible dessous.
function ClosedPanel({ isPlayer }) {
  const { host, guestId, score, visibility, dealMethod, allowMultiple, imposedColor } = useRoom();
  const { openRoom } = useRoomsActions();
  const navigate = useNavigate();
  const hostScore = score?.host ?? 0;
  const guestScore = score?.guest ?? 0;
  // Un refus devient une notification (features/notices) ; sinon, le nouveau salon.
  const again = async () => {
    const settings = { visibility, dealMethod, allowMultiple, imposedColor };
    const { payload } = await openRoom(settings);
    if (payload?.code) navigate(`/salons/${payload.code}`);
  };
  return (
    <div className="flex flex-col gap-3 box p-3 bg-pearl/60">
      <h2 className="title">Salon fermé</h2>
      {guestId ? (
        <p>
          <UserShow id={host.id} /> {hostScore} – {guestScore} <UserShow id={guestId} />
          {' · '}
          {hostScore === guestScore ? (
            'égalité'
          ) : (
            <>
              <UserShow id={hostScore > guestScore ? host.id : guestId} /> remporte le salon
            </>
          )}
        </p>
      ) : (
        <p className="text-ink-soft">Fermé avant l'arrivée d'un adversaire.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {isPlayer && (
          <button
            className="btn btn-primary"
            onClick={again}>
            Nouveau salon, mêmes réglages
          </button>
        )}
        <Link
          to="/"
          className="btn">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function RoomDetail() {
  const { id, codeLabel, status, host, guestId, score, dealMethod, imposedColor, errors } =
    useRoom();
  const { modify, committing, error: saveError } = useRoomMeta();
  // Refus d'une transition (rejoindre, fermer) : notifiés.
  useNotifyErrors(errors, saveError);
  const userId = useUserId();
  const { present, viewers, gameId, messages = [] } = useRoomChannel(id);
  const isPlayer = userId && [host?.id, guestId].map(String).includes(userId);
  const canJoin = userId && status === 'waiting' && !isPlayer;
  // Écriture immédiate : une transition, envoyée tout de suite.
  const change = (changes) => modify(changes, { delay: 0 });
  const spectators = viewers > 0 && ` · ${viewers} spectateur${viewers > 1 ? 's' : ''}`;
  // Le salon en deux lignes : son nom, puis les parties gagnées et ses réglages. Pendant
  // une partie, une seule ligne (nom et parties gagnées), les réglages sous le jeu : sur
  // un téléphone, tout ce qui sert à jouer tient à l'écran.
  const inGame = gameId && status === 'playing';
  const header = inGame ? (
    <header className="flex items-baseline gap-3 text-sm">
      <h2 className="title min-w-0 truncate">{codeLabel}</h2>
      <span className="ml-auto max-w-1/2 truncate text-ink-soft">
        <UserShow id={host.id} /> {score?.host ?? 0} – {score?.guest ?? 0} <UserShow id={guestId} />
      </span>
    </header>
  ) : (
    <header className="text-sm">
      <h2 className="title">{codeLabel}</h2>
      <p className="text-ink-soft">
        {/* Salon fermé : le score est dans l'encadré du bilan. */}
        {host && guestId && status !== 'closed' ? (
          <>
            Parties : <UserShow id={host.id} /> {score?.host ?? 0} – {score?.guest ?? 0}{' '}
            <UserShow id={guestId} />
          </>
        ) : (
          `Salon ${ROOM_STATUS[status]}`
        )}
        {' · '}
        <Settings />
        {spectators}
      </p>
    </header>
  );
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
      {header}
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
      {status === 'closed' && <ClosedPanel isPlayer={isPlayer} />}
      {gameId && (
        <GameShow
          id={gameId}
          roomClosed={status === 'closed'}
          me={userId}
          hostId={String(host?.id)}
          guestId={guestId && String(guestId)}
          roomCode={id}
          dealMethod={dealMethod}
          imposedColor={imposedColor}
          present={present}
          messages={messages}
        />
      )}
      {inGame && (
        <p className="text-sm text-ink-soft">
          <Settings />
          {spectators}
        </p>
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
