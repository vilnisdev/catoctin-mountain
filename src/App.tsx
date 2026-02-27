import { Link, Route, Routes } from "react-router-dom";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 text-sm">
          <Link className="font-medium hover:text-slate-700" to="/">
            Login
          </Link>
          <Link className="font-medium hover:text-slate-700" to="/map">
            Map
          </Link>
          <Link className="font-medium hover:text-slate-700" to="/admin">
            Admin
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route element={<LoginPage />} path="/" />
          <Route element={<MapPage />} path="/map" />
          <Route element={<AdminPage />} path="/admin" />
        </Routes>
      </main>
    </div>
  );
}

export default App;
