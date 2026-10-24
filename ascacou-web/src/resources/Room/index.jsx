import { createContext, use } from 'react';
import { Index, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';

const roomContext = createContext(null);
export const useRoom = () => use(roomContext).data;

export const roomScope = createScope(client, { endpoint: '/rooms', method: 'all' });

function RoomRow() {
  const { id, status, visibility } = useRoom();
  return (
    <li>
      {id} — {visibility}, {status}
    </li>
  );
}

const RoomController = ({ deleted }) => (deleted ? null : <RoomRow />);

export const Room = Watch(client, RoomController, roomContext);

// Salons listés : publics, et en cours (pour les spectateurs).
export const RoomIndex = (props) => (
  <Index
    scope={roomScope}
    Obs={Room}
    {...props}
  />
);
