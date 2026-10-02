import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

/**
 * Portail modal qui monte le dialogue directement sous `document.body`.
 * - Permet au dégradé sombre (backdrop) de couvrir 100% de l'écran (y compris la barre latérale).
 * - Verrouille le défilement de la page en arrière-plan pendant que la modale est ouverte.
 */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(children, document.body);
};
