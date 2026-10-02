import React from 'react';

export const DocumentsModelesView: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-card)', padding: '20px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Référentiel des Modèles Documentaires et Actes Types
      </h2>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
        Aucun référentiel de modèles approuvés n'est encore fourni par l'API.
      </div>
    </div>
    <div className="responsive-table-container" style={{ backgroundColor: 'var(--color-surface)', border: 'none', borderRadius: 'var(--radius-card)', overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <th style={{ padding: '10px 16px', width: '150px' }}>Code Modèle</th>
            <th style={{ padding: '10px 16px' }}>Intitulé & Périmètre</th>
            <th style={{ padding: '10px 16px', width: '90px' }}>Version</th>
            <th style={{ padding: '10px 16px', width: '130px' }}>Statut</th>
            <th style={{ padding: '10px 16px', width: '160px' }}>Date d'application</th>
            <th style={{ padding: '10px 16px', width: '120px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={6} style={{ padding: '24px 16px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Aucun modèle documentaire disponible.
          </td></tr>
        </tbody>
      </table>
    </div>
  </div>
);
