import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { apiPost, downloadFile, uploadFile, type ApiDocument } from '../api/client';
import { documentStateLabels } from '../api/documentStates';
import './Workflow.css';

export function DocumentsTab({ documents = [], caseId, onRefresh, canWrite = false }: {
  documents?: ApiDocument[]; caseId: string; onRefresh: () => Promise<unknown>; canWrite?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const input = useRef<HTMLInputElement>(null);

  async function run(operation: () => Promise<unknown>, refresh = true) {
    if (busy) return;
    setBusy(true); setError(''); setInfo('');
    let completed = false;
    try {
      await operation(); completed = true;
      if (refresh) await onRefresh();
    } catch (cause) {
      setError(`${completed && refresh ? 'Opération enregistrée, mais actualisation impossible : ' : ''}${cause instanceof Error ? cause.message : 'Opération impossible.'}`);
      if (!completed && refresh) await onRefresh().catch(() => undefined);
    } finally { setBusy(false); }
  }

  return <section className="workflow-card" aria-label="Documents du dossier" aria-busy={busy}>
    <div className="workflow-header"><h3>Pièces du dossier</h3>
      <button className="btn-secondary" disabled={busy} onClick={() => void run(onRefresh, false)}>Actualiser</button>
    </div>
    {canWrite && <div className="document-upload"><label className="workflow-field"><span>Ajouter une pièce</span>
      <input ref={input} type="file" accept="application/pdf,image/png,image/jpeg" disabled={busy} aria-describedby="document-upload-hint" />
      <small id="document-upload-hint">PDF ou image · 10 Mo maximum par fichier</small>
    </label>
    <button className="btn-primary" disabled={busy} onClick={() => {
      const file = input.current?.files?.[0];
      if (!file) { setError('Choisissez un fichier à déposer.'); return; }
      void run(async () => {
        const uploaded = await uploadFile(file, { case: caseId });
        setInfo(uploaded.state === 'accepted' ? 'Pièce ajoutée et disponible.' : uploaded.state === 'rejected' ? 'Cette pièce ne peut pas être utilisée. Choisissez un autre fichier.' : 'Pièce ajoutée. Elle sera disponible une fois la vérification terminée.');
        if (input.current) input.current.value = '';
      });
    }}><Upload size={14} /> {busy ? 'En cours…' : 'Ajouter'}</button></div>}
    {error && <p role="alert" className="workflow-error">{error}</p>}
    {info && <p role="status">{info}</p>}
    <div className="responsive-table-container"><table className="workflow-table">
      <thead><tr><th>Pièce</th><th>Disponibilité</th><th>Actions</th></tr></thead>
      <tbody>{documents.length === 0 && <tr><td colSpan={3}>Aucune pièce ajoutée.</td></tr>}
        {documents.map((item) => <tr key={item.id}>
          <td>{item.original_name}<small>{Math.ceil(item.size / 1024)} Ko · {new Date(item.uploaded_at).toLocaleString('fr-FR')}</small></td>
          <td>{documentStateLabels[item.state] || 'Indisponible'}{item.state === 'rejected' && <small>Ajoutez un autre fichier.</small>}{item.state === 'missing' && <small>Ajoutez à nouveau cette pièce.</small>}</td>
          <td><div className="workflow-actions">
            {canWrite && ['quarantine', 'missing'].includes(item.state) && <button className="btn-secondary" disabled={busy} onClick={() => void run(async () => {
              const result = await apiPost<ApiDocument>(`/documents/${item.id}/reanalyser/`, {});
              setInfo(result.state === 'accepted' ? 'La pièce est disponible.' : result.state === 'rejected' ? 'Cette pièce ne peut pas être utilisée. Choisissez un autre fichier.' : 'La pièce reste indisponible. Réessayez plus tard.');
            })}><RotateCcw size={14} /> Vérifier à nouveau</button>}
            <button className="btn-secondary" disabled={busy || item.state !== 'accepted'} title={item.state !== 'accepted' ? 'Cette pièce est encore indisponible.' : 'Télécharger la pièce'} onClick={() => void run(() => downloadFile(`/documents/${item.id}/telecharger/`, item.original_name))}>
              <Download size={14} /> Télécharger
            </button>
          </div></td>
        </tr>)}
      </tbody>
    </table></div>
  </section>;
}
