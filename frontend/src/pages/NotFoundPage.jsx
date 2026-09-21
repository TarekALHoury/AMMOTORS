import { Link } from 'react-router-dom';

function NotFoundPage() {
  return <main className="state-page page-content"><p className="eyebrow">404</p><h1>Page Not Found</h1><p>The page you’re looking for doesn’t exist.</p><Link className="button button-primary" to="/">Return Home</Link></main>;
}

export default NotFoundPage;
