import { Route, Routes } from 'react-router';
import Lobby from './pages/Lobby';
import RoomPage from './pages/RoomPage';
import { TopBarProvider } from './TopBar';
import Notices from './features/notices/Notices';

export default function App() {
  return (
    <main className="mx-auto max-w-md min-h-dvh px-4 py-2 flex flex-col gap-3 font-sans font-light text-ink">
      <TopBarProvider>
        <Routes>
          <Route
            path="/"
            element={<Lobby />}
          />
          <Route
            path="/salons/:code"
            element={<RoomPage />}
          />
        </Routes>
      </TopBarProvider>
      {/* Droits du jeu, voulus visibles par son auteur : tout en bas de chaque page,
          hors de l'espace de jeu (en bas de l'écran quand la page est courte). */}
      <footer className="mt-auto pt-4 text-right text-sm text-ink-soft">© Marc Buonomo</footer>
      <Notices />
    </main>
  );
}
