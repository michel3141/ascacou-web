import { useParams } from 'react-router';
import { useChannel } from '../cable';
import Identity from '../features/identity/Identity';
import { RoomShow } from '../resources/Room';

// Joueurs et spectateurs suivent le salon par le RoomChannel ; le signe de vie (30 s)
// tient la présence à jour (un joueur absent depuis 2 min peut perdre la partie).
export default function RoomPage() {
  const { code } = useParams();
  useChannel({ channel: 'RoomChannel', code }, { ping: 30_000 });
  return (
    <>
      <Identity />
      <RoomShow code={code} />
    </>
  );
}
