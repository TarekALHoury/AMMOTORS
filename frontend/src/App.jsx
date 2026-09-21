import { Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import CarDetailsPage from './pages/CarDetailsPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cars/:id" element={<CarDetailsPage />} />
      <Route path="*" element={<p className="message">Page not found.</p>} />
    </Routes>
  );
}

export default App;

