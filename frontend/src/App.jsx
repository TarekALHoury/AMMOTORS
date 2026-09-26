import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import { useInteractiveDepth } from './utils/useInteractiveDepth.js';

const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const CarsPage = lazy(() => import('./pages/CarsPage.jsx'));
const CarDetailsPage = lazy(() => import('./pages/CarDetailsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));
const AdminPage = lazy(() => import('./admin/AdminPage.jsx'));

function RouteLoading({ admin = false }) {
  return <main className={`route-loading ${admin ? 'route-loading-admin' : ''}`} aria-live="polite" aria-busy="true"><span className="route-loading-spinner" /><span>Loading page…</span></main>;
}

function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      window.requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  return null;
}

function App() {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem('ammotors.theme') === 'light' ? 'light' : 'dark');
  useInteractiveDepth();

  useEffect(() => {
    localStorage.setItem('ammotors.theme', theme);
  }, [theme]);

  if (location.pathname.startsWith('/admin')) {
    return <><ScrollManager /><Suspense fallback={<RouteLoading admin />}><Routes><Route path="/admin/*" element={<AdminPage />} /></Routes></Suspense></>;
  }

  const isHome = location.pathname === '/';
  const visibleTheme = isHome ? 'dark' : theme;

  return (
    <div className={`site-shell theme-${visibleTheme} ${isHome ? 'home-route' : ''}`}>
      <ScrollManager />
      <Navbar theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cars" element={<CarsPage />} />
          <Route path="/cars/:id" element={<CarDetailsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer theme={visibleTheme} />
    </div>
  );
}

export default App;
