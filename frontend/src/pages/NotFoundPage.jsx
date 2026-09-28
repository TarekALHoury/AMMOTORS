import { Link } from 'react-router-dom';
import { usePageMetadata } from '../utils/usePageMetadata.js';

function NotFoundPage() {
  usePageMetadata({
    title: 'Page Not Found | AM MOTORS',
    description: 'The requested AM MOTORS page could not be found.',
    path: window.location.pathname,
    robots: 'noindex, follow',
  });
  return <main className="state-page page-content"><p className="eyebrow">404</p><h1>Page Not Found</h1><p>The page you’re looking for doesn’t exist.</p><Link className="button button-primary" to="/">Return Home</Link></main>;
}

export default NotFoundPage;
