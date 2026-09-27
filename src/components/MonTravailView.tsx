import React, { useState } from 'react';
import {
  Search,
  Plus,
  Clock,
  X,
  AlertTriangle
} from 'lucide-react';
import type { DossierEnquete, UserAccount, StatutDossier, Priorite } from '../types';

interface MonTravailViewProps {
  dossiers: DossierEnquete[];
  onOpenDossier: (dossierId: string) => void;
  onCreateDossier: (newDossier: {
    reference: string;
    objet: string;
    perimetre: string;
    motifOuverture: string;
    unite: string;
    responsable: string;
    statut: StatutDossier;
    priorite: Priorite;
    echeance: string;
    prochaineAction: string;
    dateCreation: string;
    entiteControlee: {
      nom: string;
      rccm: string;
      nif: string;
      typeEntite: 'Société commerciale';
      roleDansDossier: 'Entreprise contrôlée';
      adresse: string;
      contact: string;
    };
  }) => void;
  user: UserAccount;
}

export const MonTravailView: React.FC<MonTravailViewProps> = ({
  dossiers,
  onOpenDossier,
  onCreateDossier,
  user,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<'TOUS' | 'EN_COURS' | 'EN_ATTENTE' | 'A_VALIDER'>('TOUS');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Dossier Form state
  const [formRef, setFormRef] = useState(`DGDA/DRK/DIR-ENQ/2026/084${dossiers.length + 2}`);
  const [formNom, setFormNom] = useState('');
  const [formNif, setFormNif] = useState('');
  const [formRccm, setFormRccm] = useState('');
  const formAdresse = 'Lubumbashi, Haut-Katanga';
  const [formObjet, setFormObjet] = useState('');
  const [formPriorite, setFormPriorite] = useState<Priorite>('NORMALE');
  const [formEcheance, setFormEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || !formObjet.trim()) return;

    onCreateDossier({
      reference: formRef.trim() || `DGDA/DRK/DIR-ENQ/2026/084${dossiers.length + 2}`,
      objet: formObjet.trim(),
      perimetre: 'Contrôle a posteriori des opérations en douane frontière (Exercice 2025)',
      motifOuverture: 'Instruction douanière initiée par l’agent vérificateur',
      unite: user.unite,
      responsable: `${user.grade} ${user.prenom} ${user.nom}`,
      statut: 'EN_COURS',
      priorite: formPriorite,
      echeance: formEcheance,
      prochaineAction: 'Émettre la demande de communication de pièces  ',
      dateCreation: new Date().toISOString().split('T')[0],
      entiteControlee: {
        nom: formNom.trim().toUpperCase(),
        rccm: formRccm.trim() || 'CD/LSH/RCCM/24-B-00192',
        nif: formNif.trim().toUpperCase() || 'A1099882Z',
        typeEntite: 'Société commerciale',
        roleDansDossier: 'Entreprise contrôlée',
        adresse: formAdresse.trim(),
        contact: 'direction@entreprise.cd',
      },
    });

    setFormNom('');
    setFormNif('');
    setFormRccm('');
    setFormObjet('');
    setShowCreateModal(false);
  };

  // Filter dossiers
  const filteredDossiers = dossiers.filter((d) => {
    const matchesSearch =
      d.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.entiteControlee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.entiteControlee.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.objet.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statutFilter === 'TOUS') return true;
    return d.statut === statutFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Header Minimaliste */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Dossiers d’Enquête
            </h1>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-accent)',
                fontFamily: 'SF Mono, monospace',
              }}
            >
              {dossiers.length} dossiers actifs
            </span>
          </div>
          
        </div>

        <button
          onClick={() => {
            setFormRef(`DGDA/DRK/DIR-ENQ/2026/084${dossiers.length + 2}`);
            setShowCreateModal(true);
          }}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            fontSize: '13px',
          }}
        >
          <Plus size={15} strokeWidth={2.2} />
          <span>Nouveau dossier</span>
        </button>
      </div>

      {/* 2. Controls: Search input & Status Filter Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'var(--color-surface)',
          padding: '10px 14px',
          borderRadius: '12px',
        }}
      >
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Filtrer par référence, opérateur, NIF, objet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Zen Smart Chips (Vues rapides par pilules) */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {(['TOUS', 'EN_COURS', 'EN_ATTENTE', 'A_VALIDER'] as const).map((s) => {
            const isActive = statutFilter === s;
            const labels: Record<string, string> = {
              TOUS: 'Tous les dossiers',
              EN_COURS: 'En cours',
              EN_ATTENTE: 'En attente',
              A_VALIDER: 'À valider',
            };
            const count = s === 'TOUS' ? dossiers.length : dossiers.filter((d) => d.statut === s).length;

            return (
              <button
                key={s}
                onClick={() => setStatutFilter(s)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--color-accent)' : 'var(--color-surface-elevated)',
                  color: isActive ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span>{labels[s]}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    opacity: isActive ? 0.9 : 0.6,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Minimalist Dossier Table */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px', width: '220px' }}>Date</th>
              <th style={{ padding: '12px 16px', width: '250px' }}>Opérateur </th>
              {/* <th style={{ padding: '12px 16px' }}>Objet de l’enquête</th> */}
              <th style={{ padding: '12px 16px', width: '110px' }}>Statut</th>
              <th style={{ padding: '12px 16px', width: '140px' }}>Alertes</th>
              <th style={{ padding: '12px 16px', width: '110px' }}>Échéance</th>
            </tr>
          </thead>
          <tbody>
            {filteredDossiers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucun dossier ne correspond à votre filtre.
                </td>
              </tr>
            ) : (
              filteredDossiers.map((dossier) => {
                const alertesCount = dossier.alertes?.length || 0;

                return (
                  <tr
                    key={dossier.id}
                    onClick={() => onOpenDossier(dossier.id)}
                    className="card-interactive"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {/* Ref & Horodatage : PAS DE COULEUR, PAS DE GRAS */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        <Clock size={11} />
                        <span className="font-sf">{dossier.horodatageCreation || dossier.dateCreation}</span>
                      </div>
                    </td>

                    {/* Operator Name*/}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {dossier.entiteControlee.nom}
                      </div>

                    </td>

                    {/* Investigation Object
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          color: 'var(--color-text-secondary)',
                          fontSize: '12px',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {dossier.objet}
                      </div>
                    </td> */}

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          backgroundColor:
                            dossier.statut === 'EN_COURS'
                              ? 'var(--color-surface-elevated)'
                              : dossier.statut === 'A_VALIDER'
                              ? 'var(--color-warning-surface)'
                              : 'var(--color-surface)',
                          color:
                            dossier.statut === 'EN_COURS'
                              ? 'var(--color-accent)'
                              : dossier.statut === 'A_VALIDER'
                              ? 'var(--color-warning)'
                              : 'var(--color-text-muted)',
                        }}
                      >
                        {dossier.statut === 'EN_COURS'
                          ? 'En cours'
                          : dossier.statut === 'A_VALIDER'
                          ? 'À valider'
                          : dossier.statut === 'EN_ATTENTE'
                          ? 'En attente'
                          : 'Clôturé'}
                      </span>
                    </td>

                    {/* Tasks & Alerts badges */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>


                        {alertesCount > 0 && (
                          <span
                            title={`${alertesCount} alertes`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: 'var(--color-warning)',
                              backgroundColor: 'var(--color-warning-surface)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            <AlertTriangle size={11} />
                            <span>{alertesCount}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '12px 16px' }}>
                      <span className="  " style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                        {dossier.echeance}
                      </span>
                    </td>
                    
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Creation Modal for New Dossier */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '560px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  Ouvrir un nouveau dossier d’enquête
                </h3>
            
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Référence officielle DGDA *
                </label>
                <input
                  type="text"
                  required
                  value={formRef}
                  onChange={(e) => setFormRef(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-accent)',
                    fontSize: '13px',
                    fontFamily: 'SF Mono, monospace',
                    outline: 'none',
                  }}
                />
              </div> */}

              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Nom de l’opérateur contrôlé *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : SOMIKA SAS"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    NIF *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : A0914820X"
                    value={formNif}
                    onChange={(e) => setFormNif(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div> */}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                  Objet de l’enquête douanière *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex : Contrôle de la valeur déclarée sur les déclarations d’intrants miniers..."
                  value={formObjet}
                  onChange={(e) => setFormObjet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Priorité
                  </label>
                  <select
                    value={formPriorite}
                    onChange={(e) => setFormPriorite(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    <option value="NORMALE">Normale</option>
                    <option value="URGENTE">Urgente</option>
                    <option value="SIGNALEE">Signalée</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '5px' }}>
                    Échéance d’instruction
                  </label>
                  <input
                    type="date"
                    required
                    value={formEcheance}
                    onChange={(e) => setFormEcheance(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-surface-elevated)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '12px' }}
                >
                  Ouvrir le dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
