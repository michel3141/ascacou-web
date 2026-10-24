import { Link, Route, Routes } from 'react-router';
import Lobby from './pages/Lobby';
import RoomPage from './pages/RoomPage';

export default function App() {
  return (
    <main className="mx-auto max-w-md p-4 flex flex-col gap-4">
      <h1 className="text-2xl">
        <Link to="/">Ascacou</Link>
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
