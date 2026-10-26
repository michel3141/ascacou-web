import { Route, Routes } from 'react-router';
import Lobby from './pages/Lobby';
import RoomPage from './pages/RoomPage';
import { TopBarProvider } from './TopBar';
import Notices from './features/notices/Notices';

export default function App() {
  return (
    <main className="mx-auto max-w-md px-4 py-2 flex flex-col gap-3 font-sans font-light text-ink">
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
      <Notices />
    </main>
  );
}
