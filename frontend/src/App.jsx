import { NavLink, Route, Routes, Navigate, useLocation } from "react-router-dom";
import PracticePage from "./pages/PracticePage.jsx";
import EntryPage from "./pages/EntryPage.jsx";

const PAGE_META = {
  "/": { title: "题目刷题工具", subtitle: "练习客观题与主观题" },
  "/entry": { title: "题目刷题工具", subtitle: "录入客观题与主观题" },
};

const App = () => {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] || PAGE_META["/"];

  return (
    <>
      <header className="page-header">
        <div className="header-inner">
          <div>
            <h1>{meta.title}</h1>
            <p>{meta.subtitle}</p>
          </div>
          <nav className="page-nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              做题
            </NavLink>
            <NavLink
              to="/entry"
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              录题
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="layout">
        <Routes>
          <Route path="/" element={<PracticePage />} />
          <Route path="/entry" element={<EntryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
