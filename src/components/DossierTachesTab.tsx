import React, { useState } from 'react';
import {
  Check,
  Plus,
  Clock,
  Calendar,
  X
} from 'lucide-react';
import type { TacheDossier, UserAccount } from '../types';

interface DossierTachesTabProps {
  taches: TacheDossier[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (newTask: {
    titre: string;
    description: string;
    priorite: 'URGENTE' | 'NORMALE';
    dateEcheance: string;
  }) => void;
  user: UserAccount;
}

export const DossierTachesTab: React.FC<DossierTachesTabProps> = ({
  taches,
  onToggleTask,
  onAddTask,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<'URGENTE' | 'NORMALE'>('NORMALE');
  const [dateEcheance, setDateEcheance] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) return;

    onAddTask({
      titre: titre.trim(),
      description: description.trim(),
      priorite,
      dateEcheance,
    });

    setTitre('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header of Tab */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Tâches et actions d’instruction du dossier
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Suivi des actes, vérifications documentaires et réquisitions avec horodatage certifié.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            fontSize: '12px',
          }}
        >
          <Plus size={14} strokeWidth={2.2} />
          <span>Nouvelle tâche</span>
        </button>
      </div>

      {/* Minimalist Task Table */}
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
                backgroundColor: 'var(--color-surface-elevated)',
                color: 'var(--color-text-muted)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <th style={{ padding: '12px 16px', width: '40px' }}>État</th>
              <th style={{ padding: '12px 16px' }}>Tâche & Description</th>
              <th style={{ padding: '12px 16px', width: '110px' }}>Priorité</th>
              <th style={{ padding: '12px 16px', width: '190px' }}>Horodatage de création</th>
              <th style={{ padding: '12px 16px', width: '130px' }}>Échéance</th>
              <th style={{ padding: '12px 16px', width: '160px' }}>Auteur</th>
            </tr>
          </thead>
          <tbody>
            {taches.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Aucune tâche assignée à ce dossier pour le moment.
                </td>
              </tr>
            ) : (
              taches.map((tache) => {
                const isDone = tache.statut === 'TERMINEE';
                const isInProgress = tache.statut === 'EN_COURS';

                return (
                  <tr
                    key={tache.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: isDone ? 'transparent' : 'var(--color-surface)',
                      opacity: isDone ? 0.6 : 1,
                      transition: 'background var(--transition-fast)',
                    }}
                  >
                    {/* Checkbox toggle */}
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => onToggleTask(tache.id)}
                        title={isDone ? 'Marquer à faire' : 'Marquer comme terminée'}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '5px',
                          border: isDone ? 'none' : '1.5px solid var(--color-border)',
                          backgroundColor: isDone ? 'var(--color-success)' : 'transparent',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        {isDone && <Check size={12} strokeWidth={3} />}
                      </button>
                    </td>

                    {/* Task Title & Description */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: isDone ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}
                        >
                          {tache.titre}
                        </span>
                        {isInProgress && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-info-surface)',
                              color: 'var(--color-info)',
                            }}
                          >
                            En cours
                          </span>
                        )}
                      </div>
                      {tache.description && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {tache.description}
                        </div>
                      )}
                    </td>

                    {/* Priority badge */}
                    <td style={{ padding: '12px 16px' }}>
                      {tache.priorite === 'URGENTE' ? (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            backgroundColor: 'var(--color-warning-surface)',
                            color: 'var(--color-warning)',
                          }}
                        >
                          Urgente
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            color: 'var(--color-text-muted)',
                          }}
                        >
                          Normale
                        </span>
                      )}
                    </td>

                    {/* Creation Timestamp */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        <Clock size={12} color="var(--color-accent)" />
                        <span className="  ">{tache.horodatageCreation}</span>
                      </div>
                    </td>

                    {/* Deadline */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        <Calendar size={12} />
                        <span className="  " style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                          {tache.dateEcheance}
                        </span>
                      </div>
                    </td>

                    {/* Author */}
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {tache.auteur}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      {showModal && (
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
              maxWidth: '520px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Ajouter une tâche au dossier
              </h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Intitulé de la tâche *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Convoquer le transitaire pour audit contradictoire"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-surface-elevated)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  Description / Consignes d’instruction
                </label>
                <textarea
                  rows={3}
                  placeholder="Précisez les points à examiner ou les pièces à réclamer..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Priorité
                  </label>
                  <select
                    value={priorite}
                    onChange={(e) => setPriorite(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
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
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                    Date d’échéance
                  </label>
                  <input
                    type="date"
                    required
                    value={dateEcheance}
                    onChange={(e) => setDateEcheance(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
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
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Enregistrer la tâche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
