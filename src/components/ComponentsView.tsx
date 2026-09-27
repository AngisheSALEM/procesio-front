import React, { useState } from 'react';
import {
  CheckCircle,
  Check
} from 'lucide-react';
import { mockEnquetesData } from './table-variants/mockTableData';
import { TableVariantDense } from './table-variants/TableVariantDense';
import { TableVariantAccordion } from './table-variants/TableVariantAccordion';
import { TableVariantSplitView } from './table-variants/TableVariantSplitView';
import { TableVariantGrouped } from './table-variants/TableVariantGrouped';
import { TableVariantZen } from './table-variants/TableVariantZen';

interface ComponentsViewProps {
  onOpenDossier?: (id: string) => void;
}

type VariantId = 'dense' | 'accordion' | 'split' | 'grouped' | 'zen';

interface VariantMeta {
  id: VariantId;
  number: number;
  name: string;
  tagline: string;
  inspiration: string;
  cognitiveLoad: 'Faible' | 'Moyenne' | 'Dense & Puissante';
  bestFor: string;
  advantages: string[];
}

const VARIANTS: VariantMeta[] = [
  {
    id: 'dense',
    number: 1,
    name: 'Dense & Analytique Pro',
    tagline: 'Efficacité maximale, données condensées, chiffres tabulaires et actions contextuelles.',
    inspiration: 'Linear / Stripe Data Grid / Bloomberg Terminal',
    cognitiveLoad: 'Dense & Puissante',
    bestFor: 'Vérificateurs et analystes SYDONIA traitant de gros volumes quotidiens.',
    advantages: [
      'Contrôle de densité instantané (Mode dense 32px vs aéré 44px)',
      'Chiffres tabulaires alignés strictement à droite pour comparaison financière',
      'Tri dynamique sur chaque colonne en un clic',
      'Barre d’actions groupées (Bulk actions) avec checkboxes',
      'Actions rapides discrètes au survol (copier référence, inspecter)',
    ],
  },
  {
    id: 'accordion',
    number: 2,
    name: 'Progressive Disclosure (Accordéon)',
    tagline: '3 colonnes essentielles au premier regard, un clic déplie l’instruction complète sous la ligne.',
    inspiration: 'Apple Developer Console / GitHub PR review',
    cognitiveLoad: 'Faible',
    bestFor: 'Contrôles approfondis : inspection de l’anomalie et des pièces sans changer de page.',
    advantages: [
      'Élimine la surcharge cognitive : l’œil scanne rapidement l’essentiel',
      'Détail d’audit riche intégré (Anomalie, ratio pièces 2/4, dernière action)',
      'Boutons d’actions contextuels intégrés directement sous le dossier',
      'Zéro aller-retour inutile vers d’autres écrans',
    ],
  },
  {
    id: 'split',
    number: 3,
    name: 'Split Master-Detail (Inspection Latérale)',
    tagline: 'La liste des affaires à gauche, le volet d’instruction persistant à droite.',
    inspiration: 'Stripe Dashboard / MacOS Mail / Salesforce Desk',
    cognitiveLoad: 'Moyenne',
    bestFor: 'Traitement de séries de dossiers sans jamais perdre le contexte général.',
    advantages: [
      'Navigation instantanée de dossier en dossier sans perte de contexte',
      'Fiche d’instruction détaillée toujours sous les yeux avec horodatages',
      'Bloc-notes d’enquêteur interactif pour saisir des observations à chaud',
      'Volet rétractable en un clic si besoin de plein écran',
    ],
  },
  {
    id: 'grouped',
    number: 4,
    name: 'Matrice Groupée par Risque & Statut',
    tagline: 'Découpage automatique en sections hiérarchiques (Urgences, En cours, Conformes).',
    inspiration: 'Asana / Monday Matrix / Notion Grouped Tables',
    cognitiveLoad: 'Faible',
    bestFor: 'Chefs d’unité, superviseurs et réunions de commandement matinales.',
    advantages: [
      'Priorisation visuelle immédiate des dossiers brûlants',
      'Sections repliables d’un clic pour masquer ce qui est déjà traité',
      'Sous-totaux financiers consolidés par catégorie de risque',
      'Évite l’effet "mur de données" indifférencié',
    ],
  },
  {
    id: 'zen',
    number: 5,
    name: 'Zen Minimaliste & Filtres Intelligents',
    tagline: 'Espacements généreux, filtres par pilules (chips) et colonnes personnalisables.',
    inspiration: 'Notion Tables / Apple HIG / Linear Views',
    cognitiveLoad: 'Faible',
    bestFor: 'Confort de lecture maximal, travail prolongé et personnalisation utilisateur.',
    advantages: [
      'Boutons de vues rapides en un clic (Urgences J-5, Montant > 1M$, etc.)',
      'Menu permettant d’afficher/masquer les colonnes selon son besoin',
      'Design aéré reposant pour les yeux sans bordures invasives',
      'Empty state bienveillant et ergonomique en cas de filtre vide',
    ],
  },
];

export const ComponentsView: React.FC<ComponentsViewProps> = ({ onOpenDossier }) => {
  const STORAGE_KEY = 'procezo_preferred_table_variant';
  const [selectedVariant, setSelectedVariant] = useState<VariantId>('zen');
  const [preferredVariant, setPreferredVariant] = useState<VariantId>(() => {
    return (localStorage.getItem(STORAGE_KEY) as VariantId) || 'zen';
  });
  const [showToast, setShowToast] = useState(false);
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');

  const handleChoose = (id: VariantId) => {
    setPreferredVariant(id);
    localStorage.setItem(STORAGE_KEY, id);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const currentMeta = VARIANTS.find((v) => v.id === selectedVariant) || VARIANTS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      {/* 1. Header and Impeccable Audit Findings */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-on-accent)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Lab Ergonomie & Composants
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Audit Impeccable • DGDA Procezo
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>
              Refonte Ergonomique des Tableaux de Données
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '6px', maxWidth: '820px', lineHeight: 1.5 }}>
              Actuellement, l’interface souffre d'un <strong>effet « mur de données »</strong> : jusqu'à 7 colonnes de texte brut juxtaposées sans hiérarchie progressive, chiffres non alignés, absence d'outils de tri/densité unifiés et surcharge cognitive. Voici <strong>5 approches ergonomiques distinctes</strong> conçues pour résoudre ce problème. Choisissez celle qui servira de standard pour l'ensemble du site.
            </p>
          </div>

          {/* Mode Switcher (Tabs vs Tout voir) */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--color-bg)',
              borderRadius: 'var(--radius-btn)',
              padding: '3px',
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('tabs')}
              style={{
                border: 'none',
                backgroundColor: viewMode === 'tabs' ? 'var(--color-surface-elevated)' : 'transparent',
                color: viewMode === 'tabs' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: viewMode === 'tabs' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Mode Comparateur (Onglets)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              style={{
                border: 'none',
                backgroundColor: viewMode === 'all' ? 'var(--color-surface-elevated)' : 'transparent',
                color: viewMode === 'all' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: viewMode === 'all' ? 600 : 500,
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Galerie Complète (5 Tableaux)
            </button>
          </div>
        </div>

        {/* Diagnostic Points Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase' }}>
              1. Surcharge cognitive
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Trop de détails affichés d'emblée. Solution : <em>Progressive Disclosure</em> (révéler au clic).
            </div>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase' }}>
              2. Alignement des montants
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Chiffres mélangés au texte. Solution : alignement à droite strict en police tabulaire <code style={{ fontSize: '11px' }}>tnum</code>.
            </div>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
              3. Absence de contrôle
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Manque de sélecteur de densité, de tri colonne et de filtres rapides à facettes.
            </div>
          </div>
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-success)', textTransform: 'uppercase' }}>
              4. Facteur réutilisable
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Factorisation en composants atomiques (<code style={{ fontSize: '11px' }}>TablePrimitives</code>) pérennes.
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification when choosing */}
      {showToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-on-accent)',
            padding: '12px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
          }}
        >
          <CheckCircle size={18} />
          <span>Ergonomie enregistrée pour la refonte du site !</span>
        </div>
      )}

      {/* 2. Interactive Selector Strip (In Tabs Mode) */}
      {viewMode === 'tabs' && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
            }}
          >
            {VARIANTS.map((v) => {
              const isActive = selectedVariant === v.id;
              const isPreferred = preferredVariant === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  style={{
                    backgroundColor: isActive ? 'var(--color-surface-elevated)' : 'var(--color-surface)',
                    border: isActive ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '14px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {isPreferred && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-success)',
                        color: '#FFFFFF',
                        padding: '2px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      ★ Choisi
                    </span>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--color-accent)', fontWeight: 700 }}>
                    Tableau 0{v.number}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    {v.inspiration}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Variant Evaluation Card */}
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--color-border)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                  Tableau 0{currentMeta.number} : {currentMeta.name}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  Charge cognitive : {currentMeta.cognitiveLoad}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {currentMeta.tagline}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px' }}>
                {currentMeta.advantages.map((adv, i) => (
                  <span key={i} style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} color="var(--color-accent)" />
                    {adv}
                  </span>
                ))}
              </div>
            </div>

            {/* Selection CTA */}
            <div>
              {preferredVariant === currentMeta.id ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: 'var(--color-success-surface)',
                    color: 'var(--color-success)',
                    borderRadius: 'var(--radius-btn)',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  <CheckCircle size={15} />
                  <span>Modèle actuellement retenu</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleChoose(currentMeta.id)}
                  style={{ padding: '8px 18px', fontSize: '12px' }}
                >
                  <span>Choisir ce modèle pour la refonte</span>
                </button>
              )}
            </div>
          </div>

          {/* Render Active Table Component */}
          <div>
            {selectedVariant === 'dense' && (
              <TableVariantDense data={mockEnquetesData} onSelectDossier={onOpenDossier} />
            )}
            {selectedVariant === 'accordion' && (
              <TableVariantAccordion data={mockEnquetesData} onOpenDossier={onOpenDossier} />
            )}
            {selectedVariant === 'split' && (
              <TableVariantSplitView data={mockEnquetesData} onOpenDossier={onOpenDossier} />
            )}
            {selectedVariant === 'grouped' && (
              <TableVariantGrouped data={mockEnquetesData} onOpenDossier={onOpenDossier} />
            )}
            {selectedVariant === 'zen' && (
              <TableVariantZen data={mockEnquetesData} onOpenDossier={onOpenDossier} />
            )}
          </div>
        </>
      )}

      {/* 3. All 5 Tables Stacked (In Gallery Mode) */}
      {viewMode === 'all' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {VARIANTS.map((v) => (
            <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-accent)' }}>
                      Tableau 0{v.number}
                    </span>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      {v.name}
                    </h2>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                      ({v.inspiration})
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {v.tagline}
                  </p>
                </div>

                <div>
                  {preferredVariant === v.id ? (
                    <span
                      style={{
                        padding: '6px 14px',
                        backgroundColor: 'var(--color-success-surface)',
                        color: 'var(--color-success)',
                        borderRadius: 'var(--radius-btn)',
                        fontWeight: 700,
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CheckCircle size={14} />
                      Sélectionné
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleChoose(v.id)}
                      style={{ fontSize: '11px' }}
                    >
                      Choisir ce modèle
                    </button>
                  )}
                </div>
              </div>

              {v.id === 'dense' && <TableVariantDense data={mockEnquetesData} onSelectDossier={onOpenDossier} />}
              {v.id === 'accordion' && <TableVariantAccordion data={mockEnquetesData} onOpenDossier={onOpenDossier} />}
              {v.id === 'split' && <TableVariantSplitView data={mockEnquetesData} onOpenDossier={onOpenDossier} />}
              {v.id === 'grouped' && <TableVariantGrouped data={mockEnquetesData} onOpenDossier={onOpenDossier} />}
              {v.id === 'zen' && <TableVariantZen data={mockEnquetesData} onOpenDossier={onOpenDossier} />}
            </div>
          ))}
        </div>
      )}

      {/* 4. Base Components Documentation Section */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px',
          marginTop: '16px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
          Composants de Base Réutilisables Définis pour la Refonte
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Ces briques modulaires sont situées dans <code style={{ fontSize: '11px' }}>src/components/table-system/TablePrimitives.tsx</code> et garantissent la cohérence sur tout le projet.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginTop: '16px',
          }}
        >
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableContainer /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Conteneur parent assurant le fond de surface, le rayon de courbure et le respect de la règle zéro box-shadow.
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableToolbar /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Barre d'outils unifiée : recherche en temps réel, sélecteur de densité (Dense/Aéré), badges et actions groupées.
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableHeadCell sortable /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              En-tête de colonne avec gestion du tri ascendant/descendant, indicateurs vectoriels et alignement strict.
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableCell isNumeric /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Cellule avec police tabulaire mono pour aligner parfaitement les valeurs financières et dates en colonne.
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableBadge type="..." /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Pastille de statut officielle (Critique, Contentieux, Attente, Conforme) avec surface douce teintée.
            </div>
          </div>

          <div style={{ padding: '12px 14px', backgroundColor: 'var(--color-bg)', borderRadius: '6px' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-accent)' }}>
              &lt;TableEmptyState /&gt;
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              État vide illustré avec bouton de réinitialisation des filtres évitant les écrans blancs déroutants.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
