import { useId } from 'react';
import type { ApiDocument } from '../../api/client';
import { documentStateLabels } from '../../api/documentStates';

export function DocumentPicker({ documents, value, onChange, label, disabled = false, exclude = [] }: {
  documents: ApiDocument[]; value: string; onChange: (id: string) => void; label: string;
  disabled?: boolean; exclude?: string[];
}) {
  const id = useId();
  return <div className="workflow-field">
    <label htmlFor={id}>{label}</label>
    <select id={id} aria-describedby={`${id}-hint`} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      <option value="">Choisir un PDF du dossier</option>
      {documents.filter((item) => item.content_type === 'application/pdf' && !exclude.includes(item.id)).map((item) =>
        <option key={item.id} value={item.id} disabled={item.state !== 'accepted'}>
          {item.original_name} · {documentStateLabels[item.state] || 'Indisponible'} · {new Date(item.uploaded_at).toLocaleString('fr-FR')}
        </option>)}
    </select>
    <small id={`${id}-hint`}>Vous pouvez ajouter une pièce dans l’onglet Documents.</small>
  </div>;
}
