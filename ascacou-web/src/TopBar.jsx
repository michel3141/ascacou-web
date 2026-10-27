import { createContext, use, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { useUserId } from './features/identity';
import { UserShow } from './resources/User';

// Barre du haut : le logo (retour à l'accueil), un titre (le nom du salon pendant une
// partie, tronqué), les actions de la page (annuler, abandonner, fermer le salon) et, sur
// l'accueil seulement, le pseudo du joueur, modifiable (dans un salon, il est déjà dans
// son bandeau). Une page y place son titre et ses actions avec <TopBarTitle> et
// <TopBarActions>, où qu'elle soit dans l'arbre.
const SlotContext = createContext({});

export function TopBarActions({ children }) {
  const { actions } = use(SlotContext);
  return actions ? createPortal(children, actions) : null;
}

export function TopBarTitle({ children }) {
  const { title } = use(SlotContext);
  return title ? createPortal(children, title) : null;
}

export function TopBarProvider({ children }) {
  const [actions, setActions] = useState(null);
  const [title, setTitle] = useState(null);
  const userId = useUserId();
  const home = useLocation().pathname === '/';
  return (
    <SlotContext value={{ actions, title }}>
      <header className="flex items-center gap-3 h-10">
        <Link
          to="/"
          className="mr-auto shrink-0">
          <img
            src="/logo.svg"
            alt="Ascacou"
            className="h-7"
          />
        </Link>
        <div
          ref={setTitle}
          className="flex-1 min-w-0 truncate title text-sm empty:hidden"
        />
        <div
          ref={setActions}
          className="flex items-center gap-2"
        />
        {home && userId && (
          <span className="min-w-0 text-sm text-ink-soft">
            <UserShow
              id={userId}
              editable
            />
          </span>
        )}
      </header>
      {children}
    </SlotContext>
  );
}

// Action de la barre : une icône, grisée quand elle n'est pas possible (elle garde sa
// place : les autres icônes ne bougent pas).
export function BarAction({ icon, label, disabled, onClick, className = '' }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`size-8 flex items-center justify-center rounded-lg text-ink-soft active:bg-paper disabled:opacity-30 ${className}`}
      onClick={onClick}>
      {icon}
    </button>
  );
}

// Action définitive : une icône, puis une confirmation dans la barre (« Abandonner ? »).
// className : place dans la barre (order-last pour une action rare).
export function ConfirmAction({ icon, label, question, onConfirm, className = '' }) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <BarAction
        icon={icon}
        label={label}
        className={className}
        onClick={() => setAsking(true)}
      />
    );
  return (
    <span className={`flex items-center gap-1 text-sm ${className}`}>
      {question}
      <button
        className="btn py-0.5 px-2"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}>
        Oui
      </button>
      <button
        className="btn py-0.5 px-2"
        onClick={() => setAsking(false)}>
        Non
      </button>
    </span>
  );
}

export const FlagIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5 fill-none stroke-current"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
  </svg>
);

export const UndoIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5 fill-none stroke-current"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
  </svg>
);

export const CrossIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="size-5 fill-none stroke-current"
    strokeWidth="1.8"
    strokeLinecap="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
