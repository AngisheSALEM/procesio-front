import { useEffect } from 'react';

/**
 * useCleanUI Hook
 * 
 * Inspects rendered DOM elements or components to detect and flag
 * hardcoded tutorial/filler texts, verbose explanations, or unneeded helper phrases.
 * Enforces minimalist UI: only titles, subtitles, and real database values.
 */

const FILLER_PATTERNS = [
  /cliquez sur/i,
  /aucun formulaire à saisir/i,
  /déposez simplement/i,
  /indiquez si la réponse/i,
  /suivi contradictoire de la communication/i,
  /formats acceptés/i,
  /exigibles sous peine/i,
  /renseignez l'auteur/i,
  /enregistrement du courrier/i,
  /veuillez/i,
  /aide :/i,
  /explication :/i,
];

export function useCleanUI(componentName: string, containerRef?: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (import.meta.env?.DEV && containerRef?.current) {
      const text = containerRef.current.innerText || '';
      for (const pattern of FILLER_PATTERNS) {
        if (pattern.test(text)) {
          console.warn(`[CleanUI Warning in ${componentName}] Detected filler/tutorial text matching: ${pattern}`);
        }
      }
    }
  }, [componentName, containerRef]);

  const sanitize = (text: string): string => {
    for (const pattern of FILLER_PATTERNS) {
      if (pattern.test(text)) {
        return '';
      }
    }
    return text;
  };

  return { sanitize };
}
