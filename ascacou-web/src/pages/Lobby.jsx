import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useChannel } from '../cable';
import Identity from '../features/identity/Identity';
import { useUserId } from '../features/identity';
import { useRoomsActions } from '../features/rooms';
import { RoomList } from '../resources/Room';

const lobby = { channel: 'LobbyChannel' };

const DEALS = {
  random: 'Au hasard',
  inverse: 'Jeux inversés',
  fifty: 'Autant de noirs que de blancs',
  max: 'Maximum de noirs / de blancs',
  draft: 'Pioche',
};

const VISIBILITIES = {
  public: ['Public', "listé à l'accueil"],
  private: ['Privé', 'par son lien'],
};

// Nouveau salon, dans un encadré comme ceux du livret : visibilité, distribution des
// cartes, variantes.
function OpenRoom() {
  const { openRoom } = useRoomsActions();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    visibility: 'public',
    dealMethod: 'random',
    allowMultiple: false,
    imposedColor: false,
  });
  const set = (key, value) => setSettings({ ...settings, [key]: value });
  // Un refus devient une notification (features/notices) ; sinon, le salon.
  const open = async (event) => {
    event.preventDefault();
    const { payload } = await openRoom(settings);
    if (payload?.code) navigate(`/salons/${payload.code}`);
  };
  return (
    <form
      className="flex flex-col gap-3 box p-3 bg-pearl/60"
      onSubmit={open}>
      <h2 className="title">Nouveau salon</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(VISIBILITIES).map(([value, [label, hint]]) => (
          <button
            key={value}
            type="button"
            aria-pressed={settings.visibility === value}
            className={`btn flex flex-col items-start ${settings.visibility === value ? 'btn-on' : ''}`}
            onClick={() => set('visibility', value)}>
            {label}
            <span className="text-xs text-ink-soft">{hint}</span>
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2">
        Cartes
        <select
          className="flex-1 field"
          value={settings.dealMethod}
          onChange={(event) => set('dealMethod', event.target.value)}>
          {Object.entries(DEALS).map(([value, label]) => (
            <option
              key={value}
              value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.allowMultiple}
            onChange={(event) => set('allowMultiple', event.target.checked)}
          />
          Motif multiple
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.imposedColor}
            onChange={(event) => set('imposedColor', event.target.checked)}
          />
          Pion imposé
        </label>
      </div>
      <button className="btn btn-primary self-end px-6">Ouvrir</button>
    </form>
  );
}

// Une liste de salons sous un titre ; une liste vide disparaît, ou affiche `empty`.
function Section({ title, empty, children }) {
  return (
    <section className={`room-list flex flex-col gap-1 ${empty ? '' : 'optional'}`}>
      <h2 className="title text-sm">{title}</h2>
      <ul>{children}</ul>
      {empty && <p className="empty text-sm text-ink-soft">{empty}</p>}
    </section>
  );
}

export default function Lobby() {
  useChannel(lobby);
  const userId = useUserId();
  // key : les listes dépendent du jeton, rechargées quand le joueur est créé.
  return (
    <>
      <Identity />
      {userId && (
        <Section title="Vos salons">
          <RoomList
            key={`mine-${userId}`}
            where={{ player: 'me', status: ['waiting', 'playing'] }}
          />
        </Section>
      )}
      {userId && <OpenRoom />}
      <Section
        title="À rejoindre"
        empty="Aucun salon public n'attend d'adversaire : ouvrez-en un !">
        <RoomList
          key={`waiting-${userId}`}
          where={{ status: 'waiting', visibility: 'public' }}
          hideMine
        />
      </Section>
      <Section title="En cours">
        <RoomList
          key={`playing-${userId}`}
          where={{ status: 'playing' }}
          hideMine
        />
      </Section>
      {userId && (
        <Section title="Vos salons terminés">
          <RoomList
            key={`closed-${userId}`}
            where={{ player: 'me', status: 'closed' }}
            per={5}
            variant="closed"
          />
        </Section>
      )}
    </>
  );
}
