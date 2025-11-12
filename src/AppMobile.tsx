import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Capacitor, StatusBar } from '@capacitor/core';
import { StatusBar as CapacitorStatusBar } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

import MobileWrapper from './components/ui/MobileWrapper';
import Layout from './components/ui/Layout';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Import lazy des pages
import { routes, authRoutes, adminRoutes, agencyRoutes, trustAgentRoutes } from './routes';

export default function AppMobile() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Cacher le splash screen
        await SplashScreen.hide();

        // Configurer la status bar pour mobile
        if (Capacitor.isNativePlatform()) {
          await CapacitorStatusBar.setStyle({
            style: 'LIGHT'
          });

          await CapacitorStatusBar.setBackgroundColor({
            color: '#86B53E'
          });
        }

        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsReady(true); // Continue même en cas d'erreur
      }
    };

    initializeApp();
  }, []);

  // Gérer le comportement du retour arrière spécifique pour Android
  useEffect(() => {
    const handleBackButton = (e: PopStateEvent) => {
      // Logique personnalisée si nécessaire
      e.preventDefault();
    };

    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-olive-500">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <MobileWrapper>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Routes d'authentification sans Layout */}
          {authRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}

          {/* Routes principales avec Layout */}
          <Route path="/" element={<Layout />}>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  route.protected ? (
                    <ProtectedRoute allowedRoles={route.allowedRoles}>
                      <route.component />
                    </ProtectedRoute>
                  ) : (
                    <route.component />
                  )
                }
              />
            ))}

            {/* Routes admin */}
            {adminRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={route.allowedRoles}>
                    <route.component />
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Routes agence */}
            {agencyRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={route.allowedRoles}>
                    <route.component />
                  </ProtectedRoute>
                }
              />
            ))}

            {/* Routes trust agent */}
            {trustAgentRoutes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute allowedRoles={route.allowedRoles}>
                    <route.component />
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>
        </Routes>
      </div>
    </MobileWrapper>
  );
}