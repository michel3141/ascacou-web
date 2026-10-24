import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useChannel } from '../cable';
import Identity from '../features/identity/Identity';
import { useUserId } from '../features/identity';
import { useRoomsActions } from '../features/rooms';
import { RoomIndex } from '../resources/Room';

const lobby = { channel: 'LobbyChannel' };

const DEALS = {
  random: 'Au hasard',
  inverse: 'Jeux inversés',
  fifty: 'Autant de noirs que de blancs',
  max: 'Maximum de noirs / de blancs',
  draft: 'Pioche',
};

// Ouverture d'un salon : visibilité, distribution des cartes, variantes.
function OpenRoom() {
  const { openRoom } = useRoomsActions();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    visibility: 'public',
    dealMethod: 'random',
    allowMultiple: false,
    imposedColor: false,
  });
  const [error, setError] = useState(null);
  const set = (key) => (event) =>
    setSettings({
      ...settings,
      [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    });
  const open = async (event) => {
    event.preventDefault();
    try {
      const { code } = await openRoom(settings).unwrap();
      navigate(`/salons/${code}`);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={open}>
      <label className="flex gap-2">
        Salon
        <select
          value={settings.visibility}
          onChange={set('visibility')}>
          <option value="public">public</option>
          <option value="private">privé (par lien)</option>
        </select>
      </label>
      <label className="flex gap-2">
        Cartes
        <select
          value={settings.dealMethod}
          onChange={set('dealMethod')}>
          {Object.entries(DEALS).map(([value, label]) => (
            <option
              key={value}
              value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={settings.allowMultiple}
          onChange={set('allowMultiple')}
        />
        Motif multiple
      </label>
      <label className="flex gap-2">
        <input
          type="checkbox"
          checked={settings.imposedColor}
          onChange={set('imposedColor')}
        />
        Pion imposé
      </label>
      <button className="btn">Ouvrir un salon</button>
      {error && <p className="text-red-700">{error}</p>}
    </form>
  );
}

export default function Lobby() {
  useChannel(lobby);
  const userId = useUserId();
  return (
    <>
      <Identity />
      {userId && <OpenRoom />}
      <h2 className="title text-lg">Salons</h2>
      <ul>
        <RoomIndex />
      </ul>
    </>
  );
}
