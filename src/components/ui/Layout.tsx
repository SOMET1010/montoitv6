import { Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import Header from './Header';
import Footer from './Footer';
import Chatbot from '../Chatbot';
import { ErrorBoundary } from './ErrorBoundary';

const noLayoutRoutes = ['/connexion', '/inscription', '/messages', '/auth/callback'];
const noHeaderFooterRoutes = [
  '/messages',
  '/admin/tableau-de-bord',
  '/admin/utilisateurs',
  '/admin/service-monitoring',
  '/admin/service-configuration',
  '/admin/test-data-generator',
  '/admin/demo-rapide',
  '/admin/gestion-roles',
  '/admin/cev-management',
  '/visiter',
  '/mes-visites',
  '/creer-contrat',
  '/contrat',
  '/signer-bail',
  '/bail/signer',
  '/verification',
  '/certification-ansut',
  '/mes-certificats',
  '/admin/api-keys',
  '/admin/service-providers',
];

export default function Layout() {
  const location = useLocation();
  const path = location.pathname;

  const shouldShowLayout = !noLayoutRoutes.includes(path);
  const shouldShowHeaderFooter =
    !noHeaderFooterRoutes.some((route) => path.startsWith(route)) && !noLayoutRoutes.includes(path);

  if (!shouldShowLayout) {
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
            </div>
          }
        >
          <Outlet />
          <Chatbot />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      {shouldShowHeaderFooter && <Header />}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
          </div>
        }
      >
        <main className={shouldShowHeaderFooter ? 'min-h-screen' : ''}>
          <Outlet />
        </main>
      </Suspense>
      {shouldShowHeaderFooter && <Footer />}
      <Chatbot />
    </ErrorBoundary>
  );
}
