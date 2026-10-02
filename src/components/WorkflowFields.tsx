import { useState } from 'react';
import { downloadFile, type ApiDocument } from '../api/client';
import { documentStateLabels } from '../api/documentStates';

export function DocumentSelection({ documents, selected, onChange, disabled, exclude = [], label = 'Annexes' }: {
  documents: ApiDocument[]; selected: string[]; onChange: (ids: string[]) => void; disabled: boolean; exclude?: string[]; label?: string;
}) {
  return <fieldset className="workflow-selection" disabled={disabled}><legend>{label}</legend>
    {documents.filter((doc) => !exclude.includes(doc.id)).map((doc) => <label key={doc.id}>
      <input type="checkbox" checked={selected.includes(doc.id)} disabled={doc.state !== 'accepted'} onChange={(event) => onChange(event.target.checked ? [...selected, doc.id] : selected.filter((id) => id !== doc.id))} />
      {doc.original_name} · {documentStateLabels[doc.state] || doc.state}
    </label>)}
    {!documents.length && <p>Ajoutez les pièces dans l’onglet Documents.</p>}
  </fieldset>;
}

export function AssociationSelection({ items, selected, onChange, disabled, label }: {
  items: { id: string; label: string }[]; selected: string[]; onChange: (ids: string[]) => void; disabled: boolean; label: string;
}) {
  return <fieldset className="workflow-selection" disabled={disabled}><legend>{label}</legend>
    {items.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => onChange(event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />{item.label}</label>)}
  </fieldset>;
}

export function DocumentLinks({ ids, documents }: { ids: string[]; documents: ApiDocument[] }) {
  const [error, setError] = useState('');
  return <div className="workflow-actions">{ids.map((id, index) => {
    const doc = documents.find((row) => row.id === id);
    return <button key={`${id}-${index}`} type="button" className="btn-secondary" disabled={doc?.state !== 'accepted'} onClick={() => {
      setError(''); void downloadFile(`/documents/${id}/telecharger/`, doc!.original_name).catch((cause) => setError(cause.message));
    }}>{doc?.original_name || id}{doc && doc.state !== 'accepted' ? ` · ${documentStateLabels[doc.state] || doc.state}` : ''}</button>;
  })}{error && <p role="alert" className="workflow-error">{error}</p>}</div>;
}

export function WorkflowFeedback({ error, info }: { error: string; info: string }) {
  return <>{error && <p role="alert" className="workflow-error">{error}</p>}{info && <p role="status">{info}</p>}</>;
}
