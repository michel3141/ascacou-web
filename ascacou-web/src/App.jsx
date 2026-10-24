import { Link, Route, Routes } from 'react-router';
import Lobby from './pages/Lobby';
import RoomPage from './pages/RoomPage';

export default function App() {
  return (
    <main className="mx-auto max-w-md p-4 flex flex-col gap-4 font-sans text-ink">
      <h1>
        <Link to="/">
          <img
            src="/logo.svg"
            alt="Ascacou"
            className="h-12"
          />
        </Link>
      </h1>
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
    </main>
  );
}
