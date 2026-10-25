import { createContext, use } from 'react';
import { Show, Watch, createScope } from '@lpr/redux-documents/react';
import { client } from '../../api';
import { describe } from '../../features/refusals';

const userContext = createContext(null);
export const useUser = () => use(userContext).data;
export const useUserMeta = () => use(userContext).meta;

const userScope = createScope(client, { endpoint: '/users', method: 'find' });

const UserName = () => useUser().name;

// Son propre pseudo, modifiable sur place, enregistré tout seul : redux-documents
// attend 500 ms après la dernière frappe (modify), ou enregistre tout de suite en
// quittant le champ ou avec Entrée (commit).
function NameEditor() {
  const { name, errors } = useUser();
  const { modify, commit, committing } = useUserMeta();
  const error = Object.values(errors ?? {})[0];
  return (
    <span className="flex flex-col items-end">
      <span className="flex items-center gap-1">
        {committing && <span className="text-ink-faint">…</span>}
        <input
          aria-label="Votre pseudo"
          title="Modifier votre pseudo"
          maxLength={30}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          size={Math.max(4, (name ?? '').length)}
          value={name ?? ''}
          onChange={(event) => modify({ name: event.target.value })}
          onBlur={() => commit()}
          onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
          className="bg-transparent text-right border-b border-dashed border-ink-faint focus:border-ink focus:border-solid outline-none"
        />
      </span>
      {error && <span className="text-xs text-alert">{describe(error).message}</span>}
    </span>
  );
}

const UserController = ({ deleted, editable }) =>
  deleted ? null : editable ? <NameEditor /> : <UserName />;

export const User = Watch(client, UserController, userContext);

// Nom d'un joueur, par son id ; editable : son propre pseudo, modifiable.
export const UserShow = ({ id, editable }) => (
  <Show
    key={id}
    scope={userScope}
    request={{ id: String(id) }}
    Obs={User}
    editable={editable}
  />
);
