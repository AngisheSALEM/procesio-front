import { useState } from 'react';
import { apiPatch, apiPost, downloadFile, type ApiDefense, type ApiDocument, type ApiMission, type ApiObservationAssessment, type ApiSheet } from '../api/client';
import { assessObservation, recordDefense } from '../api/workflows';
import { latestVersion } from '../api/mappers';
import { DocumentPicker } from './common/DocumentPicker';
import { AssociationSelection, DocumentSelection, DocumentLinks, WorkflowFeedback } from './WorkflowFields';
import { useWorkflowAction } from '../api/useWorkflowAction';
import './Workflow.css';

function SheetEditor({ sheet, documents, busy, onSave }: {
  sheet: ApiSheet; documents: ApiDocument[]; busy: boolean; onSave: (body: object) => void;
}) {
  const [form, setForm] = useState({ concerned_party: sheet.concerned_party, recipient_address: sheet.recipient_address, subject: sheet.subject || '', legal_basis: sheet.legal_basis || '', meeting_on: sheet.meeting_on || '', facts: sheet.facts });
  const [rows, setRows] = useState(sheet.observations.map((row) => ({ ...row, id: row.id as string | null })));
  return <details><summary>Modifier la feuille et ses constats</summary><form className="workflow-proof" onSubmit={(event) => { event.preventDefault(); onSave({ ...form, meeting_on: form.meeting_on || null, observations: rows }); }}>
    <div className="workflow-fields">{(['concerned_party', 'recipient_address', 'subject', 'legal_basis', 'meeting_on'] as const).map((name) => <label className="workflow-field" key={name}>
      <span>{{ concerned_party: 'Destinataire', recipient_address: 'Adresse', subject: 'Objet', legal_basis: 'Cadre légal', meeting_on: 'Réunion prévue' }[name]}</span>
      <input type={name === 'meeting_on' ? 'date' : 'text'} required={name === 'concerned_party' || name === 'recipient_address'} maxLength={name === 'recipient_address' || name === 'legal_basis' ? 500 : 240} disabled={busy} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />
    </label>)}</div>
    <label className="workflow-field"><span>Faits de la feuille</span><textarea required maxLength={4000} disabled={busy} value={form.facts} onChange={(event) => setForm({ ...form, facts: event.target.value })} /></label>
    {rows.map((row, index) => <div className="workflow-proof" key={row.id || `new-${index}`}>
      <strong>O{index + 1}</strong>
      {(['title', 'facts', 'legal_references', 'questions', 'analysis'] as const).map((name) => <label className="workflow-field" key={name}>
        <span>{{ title: 'Titre', facts: 'Faits constatés', legal_references: 'Références juridiques', questions: 'Questions à l’assujetti', analysis: 'Analyse du constat' }[name]} O{index + 1}</span>
        <textarea required={name === 'facts'} maxLength={name === 'title' ? 240 : name === 'legal_references' ? 500 : 2000} disabled={busy} value={row[name] || ''} onChange={(event) => setRows(rows.map((item, i) => i === index ? { ...item, [name]: event.target.value } : item))} />
      </label>)}
      <DocumentSelection documents={documents} label={`Justificatifs de O${index + 1}`} selected={row.documents} disabled={busy} onChange={(ids) => setRows(rows.map((item, i) => i === index ? { ...item, documents: ids } : item))} />
      <button type="button" className="btn-secondary" disabled={busy || rows.length === 1} onClick={() => setRows(rows.filter((_, i) => i !== index))}>Retirer O{index + 1}</button>
    </div>)}
    <div className="workflow-actions"><button type="button" className="btn-secondary" disabled={busy || rows.length >= 20} onClick={() => setRows([...rows, { id: null, number: rows.length + 1, facts: '', documents: [], assessment_version: 0 }])}>Ajouter un constat</button>
      <button className="btn-primary" disabled={busy}>Enregistrer la feuille et les constats</button></div>
  </form></details>;
}

function ObservationAssessmentEditor({ sheet, observation, defenses, history, busy, onSave }: {
  sheet: ApiSheet; observation: ApiSheet['observations'][number]; defenses: ApiDefense[]; history: ApiObservationAssessment[]; busy: boolean; onSave: (operation: () => Promise<unknown>) => void;
}) {
  const current = latestVersion(history);
  const linked = defenses.filter((row) => row.observations.includes(observation.id));
  const [defenseId, setDefenseId] = useState(current?.defense || linked.at(-1)?.id || '');
  const [conclusion, setConclusion] = useState<string>(current?.conclusion || 'pending');
  const [motivation, setMotivation] = useState(current?.reason || '');
  return <form className="workflow-proof" onSubmit={(event) => {
    event.preventDefault(); const defense = linked.find((row) => row.id === defenseId);
    if (defense) onSave(() => assessObservation(sheet, observation, defense, conclusion, motivation));
  }}>
    <strong>Appréciation de O{observation.number} · {observation.title || observation.facts}</strong>
    {linked.length === 0 ? <p>Aucune défense pour ce constat.</p> : <div className="workflow-fields">
      <label className="workflow-field"><span>Défense de O{observation.number}</span><select required value={defenseId} disabled={busy} onChange={(event) => setDefenseId(event.target.value)}>{linked.map((row) => <option key={row.id} value={row.id}>{row.received_on} · {row.id}</option>)}</select></label>
      <label className="workflow-field"><span>Conclusion de O{observation.number}</span><select value={conclusion} disabled={busy} onChange={(event) => setConclusion(event.target.value)}><option value="pending">À apprécier</option><option value="satisfactory">Satisfait</option><option value="unsatisfactory">Non satisfait</option></select></label>
      <label className="workflow-field"><span>Motif pour O{observation.number}</span><textarea required maxLength={500} value={motivation} disabled={busy} onChange={(event) => setMotivation(event.target.value)} /></label>
    </div>}
    {linked.length > 0 && <button className="btn-primary" disabled={busy || !defenseId || !motivation.trim()}>Enregistrer l’appréciation de O{observation.number}</button>}
    <details><summary>Historique de O{observation.number} ({history.length})</summary>{history.map((row) => <p key={row.id}>Version {row.version} · {row.conclusion === 'satisfactory' ? 'Satisfait' : row.conclusion === 'unsatisfactory' ? 'Non satisfait' : 'À apprécier'} · {row.reason} · {new Date(row.recorded_at).toLocaleString('fr-FR')}</p>)}</details>
  </form>;
}

export function InspectionWorkflowPanel({ sheet, missions, defenses, assessments, documents, canEdit, actorId, onRefresh }: {
  sheet: ApiSheet; missions: ApiMission[]; defenses: ApiDefense[]; assessments: Record<string, ApiObservationAssessment[]>; documents: ApiDocument[]; canEdit: boolean; actorId?: number; onRefresh: () => Promise<unknown>;
}) {
  const action = useWorkflowAction(onRefresh);
  const [letter, setLetter] = useState(''); const [annexes, setAnnexes] = useState<string[]>([]); const [selected, setSelected] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); const [complement, setComplement] = useState('');
  const owned = canEdit && actorId === sheet.author;
  const scopedDocuments = documents.filter((doc) => doc.case === sheet.case);
  const mission = missions.find((row) => row.id === sheet.mission);
  return <section className="workflow-card" aria-label="Feuille, défenses et appréciations" aria-busy={action.busy}>
    <h3>Feuille · version {sheet.version}</h3><WorkflowFeedback {...action} />
    <p>{mission ? `Mission du ${mission.occurred_on} · ${mission.context}` : 'Constat terrain'} · {sheet.reference}</p>
    {owned && <SheetEditor key={`${sheet.id}/${sheet.version}`} sheet={sheet} documents={scopedDocuments} busy={action.busy} onSave={(body) => void action.run(() => apiPatch(`/feuilles/${sheet.id}/`, { version: sheet.version, ...body }), 'Feuille enregistrée avec ses associations.')} />}
    <div className="workflow-actions">{owned && <button className="btn-primary" disabled={action.busy} onClick={() => void action.run(() => apiPost(`/feuilles/${sheet.id}/preparer/`, { version: sheet.version }), 'Projet PDF préparé.')}>Préparer le projet PDF</button>}
      {(sheet.projects || []).map((project) => <button key={project.id} className="btn-secondary" disabled={action.busy} onClick={() => void action.run(() => downloadFile(`/projets-feuille/${project.id}/telecharger/`, `projet-${sheet.reference || sheet.id}-v${project.sheet_version}.pdf`), 'Projet téléchargé.')}>Télécharger le projet v{project.sheet_version}{project.sheet_version === sheet.version ? ' · courant' : ' · historique'}</button>)}
    </div>
    {sheet.observations.map((observation) => <div className="workflow-proof" key={observation.id}><strong>O{observation.number} · {observation.title || observation.facts}</strong><p>{observation.facts}</p><p>{observation.questions}</p><DocumentLinks ids={observation.documents} documents={scopedDocuments} /></div>)}
    <h3>Défenses enregistrées ({defenses.length})</h3>
    {defenses.map((row) => <article className="workflow-proof" key={row.id}><strong>Défense du {row.received_on}</strong><p>Constats concernés : {row.observations.map((id) => `O${sheet.observations.find((item) => item.id === id)?.number || id}`).join(', ')}</p>
      {row.complement_of && <p>Complément de la défense {row.complement_of}</p>}<DocumentLinks ids={[row.letter, ...row.annexes]} documents={scopedDocuments} /></article>)}
    {canEdit && <details><summary>Enregistrer une défense</summary><form className="workflow-proof" onSubmit={(event) => {
      event.preventDefault(); void action.run(() => recordDefense(sheet, scopedDocuments, { letter, annexes, received_on: date, observation_ids: selected, ...(complement ? { complement_of: complement } : {}) }), 'Défense enregistrée pour les constats sélectionnés.', () => { setLetter(''); setAnnexes([]); setSelected([]); setComplement(''); });
    }}>
      <DocumentPicker documents={scopedDocuments} label="Courrier de défense" value={letter} disabled={action.busy} onChange={(id) => { setLetter(id); setAnnexes(annexes.filter((value) => value !== id)); }} />
      <DocumentSelection documents={scopedDocuments} label="Annexes de la défense" selected={annexes} onChange={setAnnexes} disabled={action.busy} exclude={[letter]} />
      <label className="workflow-field"><span>Date de réception de la défense</span><input type="date" required value={date} disabled={action.busy} onChange={(event) => setDate(event.target.value)} /></label>
      <label className="workflow-field"><span>Complément d’une défense</span><select value={complement} disabled={action.busy} onChange={(event) => setComplement(event.target.value)}><option value="">Défense indépendante</option>{defenses.map((row) => <option key={row.id} value={row.id}>{row.received_on} · {row.id}</option>)}</select></label>
      <AssociationSelection label="Constats concernés par la défense" items={sheet.observations.map((row) => ({ id: row.id, label: `O${row.number} · ${row.title || row.facts}` }))} selected={selected} onChange={setSelected} disabled={action.busy} />
      <button className="btn-primary" disabled={action.busy || !letter || !selected.length}>Enregistrer la défense</button>
    </form></details>}
    {sheet.observations.map((observation) => canEdit ? <ObservationAssessmentEditor key={`${observation.id}/${observation.assessment_version}/${defenses.length}`} sheet={sheet} observation={observation} defenses={defenses} history={assessments[observation.id] || []} busy={action.busy} onSave={(operation) => void action.run(operation, `Appréciation de O${observation.number} enregistrée.`)} /> : <p key={observation.id}>O{observation.number} · {latestVersion(assessments[observation.id] || [])?.reason || 'Aucune appréciation'}</p>)}
  </section>;
}
