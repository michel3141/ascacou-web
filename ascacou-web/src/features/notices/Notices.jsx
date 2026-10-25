import { useEffect } from 'react';
import { useNotices, useNoticesActions } from '.';

const DURATION_MS = 4000;

// Une notification : en brique sur papier clair, elle s'efface seule, ou quand on la
// touche.
function Notice({ id, message }) {
  const { DISMISS_EVENT: dismiss } = useNoticesActions();
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), DURATION_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);
  return (
    <button
      type="button"
      role="alert"
      onClick={() => dismiss(id)}
      className="pointer-events-auto rounded-lg border border-alert bg-pearl px-3 py-2 text-alert shadow-sm">
      {message}
    </button>
  );
}

// Par-dessus la page, sous la barre du haut : ne déplace rien.
export default function Notices() {
  const notices = useNotices();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-12 z-10 mx-auto flex max-w-md flex-col items-center gap-2 px-4">
      {notices.map((notice) => (
        <Notice
          key={notice.id}
          {...notice}
        />
      ))}
    </div>
  );
}
