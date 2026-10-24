import { createContext, use, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router';
import { useUserId } from './features/identity';
import { UserShow } from './resources/User';

// Barre du haut : le logo (retour à l'accueil), les actions de la page (annuler,
// abandonner, fermer le salon) et, sur l'accueil seulement, le nom du joueur (dans un
// salon, il est déjà dans son bandeau). Une page y place ses actions avec <TopBarActions>, où qu'elle soit dans l'arbre.
const SlotContext = createContext(null);

export function TopBarActions({ children }) {
  const slot = use(SlotContext);
  return slot ? createPortal(children, slot) : null;
}

export function TopBarProvider({ children }) {
  const [slot, setSlot] = useState(null);
  const userId = useUserId();
  const home = useLocation().pathname === '/';
  return (
    <SlotContext value={slot}>
      <header className="flex items-center gap-3 h-10">
        <Link
          to="/"
          className="mr-auto">
          <img
            src="/logo.svg"
            alt="Ascacou"
            className="h-7"
          />
        </Link>
        <div
          ref={setSlot}
          className="flex items-center gap-2"
        />
        {home && userId && (
          <span className="text-sm text-ink-soft">
            <UserShow id={userId} />
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
