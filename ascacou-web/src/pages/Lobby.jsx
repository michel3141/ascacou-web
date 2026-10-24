import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useChannel } from '../cable';
import Identity from '../features/identity/Identity';
import { useUserId } from '../features/identity';
import { useRoomsActions } from '../features/rooms';
import { RoomIndex } from '../resources/Room';

const lobby = { channel: 'LobbyChannel' };

function OpenRoom() {
  const { openRoom } = useRoomsActions();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const open = async (visibility) => {
    try {
      const { code } = await openRoom({ visibility }).unwrap();
      navigate(`/salons/${code}`);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <div className="flex gap-2">
      <button
        className="border px-3 py-1"
        onClick={() => open('public')}>
        Ouvrir un salon public
      </button>
      <button
        className="border px-3 py-1"
        onClick={() => open('private')}>
        Salon privé
      </button>
      {error && <p className="text-red-700">{error}</p>}
    </div>
  );
}

export default function Lobby() {
  useChannel(lobby);
  const userId = useUserId();
  return (
    <>
      <Identity />
      {userId && <OpenRoom />}
      <h2 className="text-xl">Salons</h2>
      <ul>
        <RoomIndex />
      </ul>
    </>
  );
}
