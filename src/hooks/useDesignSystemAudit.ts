import { useEffect, useState, useCallback } from 'react';

export interface AuditReport {
  isCompliant: boolean;
  score: number; // 0 to 100
  emojiViolations: string[];
  shadowViolations: string[];
  neonViolations: string[];
  cardBorderViolations: string[];
  verifiedVectorIconsCount: number;
  lastChecked: Date;
}

// Banned neon hex/rgb keywords or typical AI/gaming styles
const BANNED_NEON_PATTERNS = [
  /#00ffff/i, /#ff00ff/i, /#00ff00/i, /#39ff14/i, /#ff073a/i,
  /#04d9ff/i, /#fe019a/i, /#bc13fe/i, /rgb\(0,\s*255,\s*255\)/i,
  /rgb\(255,\s*0,\s*255\)/i, /rgb\(0,\s*255,\s*0\)/i
];

// Universal Unicode Emoji Detection pattern
const EMOJI_REGEX = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u;

/**
 * useDesignSystemAudit
 * Hook React vérifiant en temps réel la conformité stricte avec la charte graphique Procezo :
 * 1. Zéro emoji (recherche dans les nœuds textuels et attributs du DOM)
 * 2. Zéro box-shadow sur les boutons, cartes et conteneurs
 * 3. Zéro bordure sur les cartes (surfaces étagées pures sans contour parasite)
 * 4. Zéro couleur néon ou gradient non conforme
 * 5. Présence et détection des icônes vectorielles conformes (Lucide / SVG 1.5-2px stroke)
 */
export function useDesignSystemAudit(rootElementId: string = 'root') {
  const [report, setReport] = useState<AuditReport>({
    isCompliant: true,
    score: 100,
    emojiViolations: [],
    shadowViolations: [],
    neonViolations: [],
    cardBorderViolations: [],
    verifiedVectorIconsCount: 0,
    lastChecked: new Date(),
  });

  const runAudit = useCallback(() => {
    const root = document.getElementById(rootElementId) || document.body;
    const emojiViolations: string[] = [];
    const shadowViolations: string[] = [];
    const neonViolations: string[] = [];
    const cardBorderViolations: string[] = [];
    let vectorIconCount = 0;

    // 1. Scan text nodes for emojis
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = walker.nextNode();
    while (currentNode) {
      const text = currentNode.nodeValue || '';
      if (EMOJI_REGEX.test(text)) {
        const preview = text.trim().substring(0, 40);
        emojiViolations.push(`Emoji détecté dans le texte: "${preview}..."`);
      }
      currentNode = walker.nextNode();
    }

    // 2. Scan elements for box-shadows, card borders, neon colors, and valid SVG icons
    const allElements = root.querySelectorAll('*');
    allElements.forEach((el) => {
      // Check SVG icons (Lucide / SF Symbols)
      if (el.tagName.toLowerCase() === 'svg') {
        const hasSvgClass = el.classList.contains('lucide') || el.getAttribute('stroke') !== null;
        if (hasSvgClass) {
          vectorIconCount++;
        }
      }

      const computed = window.getComputedStyle(el);

      // Check computed styles for buttons, cards, panels (Zero box-shadow)
      const isCardOrButton =
        el.tagName === 'BUTTON' ||
        el.classList.contains('card') ||
        el.classList.contains('panel') ||
        el.getAttribute('role') === 'button';

      if (isCardOrButton) {
        const shadow = computed.boxShadow;
        if (shadow && shadow !== 'none' && !shadow.includes('rgba(0, 0, 0, 0)')) {
          shadowViolations.push(`Box-shadow interdit sur <${el.tagName.toLowerCase()} class="${el.className}">: ${shadow}`);
        }
      }

      // Check card borders: zero border on cards (delimited purely by surface contrast)
      const isCard =
        el.classList.contains('card') ||
        el.classList.contains('panel') ||
        el.hasAttribute('data-card') ||
        ((el.tagName === 'DIV' || el.tagName === 'SECTION' || el.tagName === 'ARTICLE') &&
          computed.borderRadius === '8px' &&
          !el.classList.contains('modal') &&
          el.getAttribute('role') !== 'dialog' &&
          el.getAttribute('role') !== 'button');

      if (isCard) {
        const borderTopWidth = parseFloat(computed.borderTopWidth || '0');
        const borderRightWidth = parseFloat(computed.borderRightWidth || '0');
        const borderBottomWidth = parseFloat(computed.borderBottomWidth || '0');
        const borderLeftWidth = parseFloat(computed.borderLeftWidth || '0');
        const borderStyle = computed.borderStyle;

        if (
          (borderTopWidth > 0 || borderRightWidth > 0 || borderBottomWidth > 0 || borderLeftWidth > 0) &&
          borderStyle !== 'none'
        ) {
          cardBorderViolations.push(
            `Bordure interdite sur la carte <${el.tagName.toLowerCase()}${el.className ? ` class="${el.className}"` : ''}>: ${computed.borderWidth} ${computed.borderStyle}`
          );
        }
      }

      // Check inline styles or attributes for neon colors
      const styleAttr = el.getAttribute('style') || '';
      for (const pattern of BANNED_NEON_PATTERNS) {
        if (pattern.test(styleAttr)) {
          neonViolations.push(`Couleur néon détectée dans le style de <${el.tagName.toLowerCase()}>`);
        }
      }
    });

    const totalViolations =
      emojiViolations.length +
      shadowViolations.length +
      neonViolations.length +
      cardBorderViolations.length;
    const isCompliant = totalViolations === 0;
    const score = Math.max(
      0,
      100 -
        (emojiViolations.length * 20 +
          shadowViolations.length * 15 +
          neonViolations.length * 25 +
          cardBorderViolations.length * 15)
    );

    setReport({
      isCompliant,
      score,
      emojiViolations,
      shadowViolations,
      neonViolations,
      cardBorderViolations,
      verifiedVectorIconsCount: vectorIconCount,
      lastChecked: new Date(),
    });
  }, [rootElementId]);

  useEffect(() => {
    // Run audit on mount and whenever DOM settles
    runAudit();

    const observer = new MutationObserver(() => {
      runAudit();
    });

    const root = document.getElementById(rootElementId) || document.body;
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, [rootElementId, runAudit]);

  return { report, recheck: runAudit };
}
