import { useState } from 'react';
import { apiPost, type ApiCase, type ApiDocument, type ApiMission, type ApiUser } from '../api/client';
import { AssociationSelection, DocumentSelection, DocumentLinks, WorkflowFeedback } from './WorkflowFields';
import { useWorkflowAction } from '../api/useWorkflowAction';
import './Workflow.css';

export function MissionsPanel({ caseRow, missions, documents, users, eligibleIds, actorId, canEdit, onRefresh }: {
  caseRow: ApiCase; missions: ApiMission[]; documents: ApiDocument[]; users: ApiUser[]; eligibleIds: number[]; actorId?: number; canEdit: boolean; onRefresh: () => Promise<unknown>;
}) {
  const action = useWorkflowAction(onRefresh);
  const [context, setContext] = useState(''); const [findings, setFindings] = useState(''); const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [participants, setParticipants] = useState<string[]>(actorId && eligibleIds.includes(actorId) ? [String(actorId)] : []);
  const [pieces, setPieces] = useState<string[]>([]);
  const name = (id: number) => { const user = users.find((row) => row.id === id); return user ? `${user.first_name} ${user.last_name}`.trim() || user.username : `Agent ${id}`; };
  return <section className="workflow-card" aria-label="Missions du dossier" aria-busy={action.busy}>
    <h3>Missions du dossier ({missions.length})</h3><WorkflowFeedback {...action} />
    {!missions.length && <p>Aucune mission enregistrée.</p>}
    {missions.map((mission) => <article className="workflow-proof" key={mission.id}><strong>{mission.occurred_on} · {mission.context}</strong><p>{mission.findings}</p><p>Participants : {mission.participants.map(name).join(', ')}</p><DocumentLinks ids={mission.documents} documents={documents} /></article>)}
    {canEdit && <details><summary>Enregistrer une mission réalisée</summary><form className="workflow-proof" onSubmit={(event) => {
      event.preventDefault(); void action.run(() => apiPost('/missions/', { case: caseRow.id, context, findings, occurred_on: date, participants: participants.map(Number), documents: pieces }), 'Mission enregistrée.', () => { setContext(''); setFindings(''); setPieces([]); });
    }}>
      <label className="workflow-field"><span>Contexte de la mission</span><textarea required maxLength={500} value={context} disabled={action.busy} onChange={(event) => setContext(event.target.value)} /></label>
      <label className="workflow-field"><span>Constats de la mission</span><textarea required maxLength={4000} value={findings} disabled={action.busy} onChange={(event) => setFindings(event.target.value)} /></label>
      <label className="workflow-field"><span>Date de la mission</span><input type="date" required value={date} disabled={action.busy} onChange={(event) => setDate(event.target.value)} /></label>
      <AssociationSelection label="Participants habilités" items={eligibleIds.map((id) => ({ id: String(id), label: name(id) }))} selected={participants} onChange={setParticipants} disabled={action.busy} />
      <DocumentSelection label="Justificatifs de la mission" documents={documents} selected={pieces} onChange={setPieces} disabled={action.busy} />
      <button className="btn-primary" disabled={action.busy || !participants.length}>Enregistrer la mission</button>
    </form></details>}
  </section>;
}
