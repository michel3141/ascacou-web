import { useState } from 'react';
import { RoomIndex } from './resources/Room';
import { useIdentityActions, useUserId } from './features/identity';
import { useChannel } from './cable';

function Identity() {
  const userId = useUserId();
  const { createIdentity } = useIdentityActions();
  const [name, setName] = useState('');
  if (userId) return <p>Joueur n° {userId}</p>;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        createIdentity({ name });
      }}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Pseudo"
      />
      <button>Jouer</button>
    </form>
  );
}

const lobby = { channel: 'LobbyChannel' };

export default function App() {
  useChannel(lobby);
  return (
    <main>
      <h1>Ascacou</h1>
      <Identity />
      <h2>Salons</h2>
      <ul>
        <RoomIndex />
      </ul>
    </main>
  );
}
