import { useEffect, useState } from 'react';
import { DeviceService } from '../../services/deviceService';
import { useBackButton } from '../../hooks/useBackButton';

interface MobileWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function MobileWrapper({ children, className = '' }: MobileWrapperProps) {
  const [safeAreaInsets, setSafeAreaInsets] = useState(DeviceService.getSafeAreaInsets());
  const [isNative, setIsNative] = useState(DeviceService.isNative());

  // Utiliser le hook du bouton retour
  useBackButton();

  useEffect(() => {
    // Vérifier si on est sur un appareil natif
    setIsNative(DeviceService.isNative());
    setSafeAreaInsets(DeviceService.getSafeAreaInsets());
  }, []);

  // Styles CSS variables pour le safe area
  const safeAreaStyles = {
    '--safe-area-inset-top': `${safeAreaInsets.top}px`,
    '--safe-area-inset-right': `${safeAreaInsets.right}px`,
    '--safe-area-inset-bottom': `${safeAreaInsets.bottom}px`,
    '--safe-area-inset-left': `${safeAreaInsets.left}px`,
    paddingTop: isNative ? `${safeAreaInsets.top}px` : '0',
    paddingBottom: isNative ? `${safeAreaInsets.bottom}px` : '0',
  } as React.CSSProperties;

  return (
    <div
      className={`mobile-wrapper ${className}`}
      style={safeAreaStyles}
    >
      {children}

      {isNative && (
        <style jsx>{`
          .mobile-wrapper {
            /* Éviter les zones système sur mobile */
            padding-top: env(safe-area-inset-top, 0);
            padding-bottom: env(safe-area-inset-bottom, 0);
            padding-left: env(safe-area-inset-left, 0);
            padding-right: env(safe-area-inset-right, 0);

            /* Améliorer le scroll sur mobile */
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
          }

          /* Éviter le zoom sur mobile */
          input, textarea, select {
            font-size: 16px !important;
          }
        `}</style>
      )}
    </div>
  );
}