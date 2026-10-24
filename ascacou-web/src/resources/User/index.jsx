import { createContext, use } from 'react';
import { Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';

const userContext = createContext(null);
export const useUser = () => use(userContext).data;

const userScope = createScope(client, { endpoint: '/users', method: 'find' });

const UserName = () => useUser().name;

const UserController = ({ deleted }) => (deleted ? null : <UserName />);

export const User = Watch(client, UserController, userContext);

// Nom d'un joueur, par son id.
export const UserShow = ({ id }) => (
  <Show
    key={id}
    scope={userScope}
    request={{ id: String(id) }}
    Obs={User}
  />
);
