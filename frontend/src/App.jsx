import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import CarsPage from './pages/CarsPage.jsx';
import CarDetailsPage from './pages/CarDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminPage from './admin/AdminPage.jsx';
import { useInteractiveDepth } from './utils/useInteractiveDepth.js';

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
  useInteractiveDepth();

  if (location.pathname.startsWith('/admin')) {
    return <><ScrollManager /><Routes><Route path="/admin/*" element={<AdminPage />} /></Routes></>;
  }

  return (
    <div className="site-shell">
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/cars/:id" element={<CarDetailsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
