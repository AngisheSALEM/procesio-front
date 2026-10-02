import { useState } from 'react';
import type { ApiAssessment, ApiDocument, ApiRequest, ApiResponse } from '../api/client';
import { assessRequestItem, recordResponse, rectifyResponse } from '../api/workflows';
import { latestVersion } from '../api/mappers';
import { DocumentPicker } from './common/DocumentPicker';
import { AssociationSelection, DocumentSelection, DocumentLinks, WorkflowFeedback } from './WorkflowFields';
import { useWorkflowAction } from '../api/useWorkflowAction';
import './Workflow.css';

function ItemAssessmentEditor({ request, item, received, history, busy, onSave }: {
  request: ApiRequest; item: ApiRequest['items'][number]; received: boolean; history: ApiAssessment[]; busy: boolean;
  onSave: (operation: () => Promise<unknown>) => void;
}) {
  const current = latestVersion(history);
  const [completeness, setCompleteness] = useState(current?.completeness || 'unknown');
  const [substance, setSubstance] = useState(current?.substance || 'pending');
  const [motivation, setMotivation] = useState(current?.reason || '');
  return <form className="workflow-proof" onSubmit={(event) => { event.preventDefault(); onSave(() => assessRequestItem(request, item, received, completeness, substance, motivation)); }}>
    <strong>Élément {item.number} · {item.label}</strong><p>{received ? 'Réponse liée' : 'Aucune réponse liée'}</p>
    <div className="workflow-fields">
      <label className="workflow-field"><span>Complétude de l’élément {item.number}</span><select disabled={busy || !received} value={received ? completeness : 'unknown'} onChange={(event) => setCompleteness(event.target.value)}>
        <option value="unknown">Non évaluée</option><option value="complete">Complet</option><option value="insufficient">Insuffisant</option>
      </select></label>
      <label className="workflow-field"><span>Appréciation de l’élément {item.number}</span><select disabled={busy || !received} value={received ? substance : 'pending'} onChange={(event) => setSubstance(event.target.value)}>
        <option value="pending">À apprécier</option><option value="satisfactory">Satisfait</option><option value="unsatisfactory">Non satisfait</option>
      </select></label>
      <label className="workflow-field"><span>Motif pour l’élément {item.number}</span><textarea required maxLength={500} disabled={busy} value={motivation} onChange={(event) => setMotivation(event.target.value)} /></label>
    </div><button className="btn-primary" disabled={busy || !motivation.trim()}>Enregistrer l’appréciation de l’élément {item.number}</button>
    <details><summary>Historique des appréciations ({history.length})</summary>{history.map((row) => <p key={row.id}>Version {row.version} · {row.substance === 'satisfactory' ? 'Satisfait' : row.substance === 'unsatisfactory' ? 'Non satisfait' : 'À apprécier'} · {row.reason} · {new Date(row.recorded_at).toLocaleString('fr-FR')}</p>)}</details>
  </form>;
}

function ResponseLinksEditor({ response, request, busy, onSave }: {
  response: ApiResponse; request: ApiRequest; busy: boolean; onSave: (operation: () => Promise<unknown>) => void;
}) {
  const [selected, setSelected] = useState(response.item_links.filter((link) => !link.voided_at).map((link) => link.item));
  const [motivation, setMotivation] = useState('');
  return <details><summary>Rectifier les associations de ce courrier</summary><form className="workflow-proof" onSubmit={(event) => { event.preventDefault(); onSave(() => rectifyResponse(response, selected, motivation)); }}>
    <AssociationSelection label="Éléments réellement couverts" items={request.items.map((item) => ({ id: item.id, label: `${item.number} · ${item.label}` }))} selected={selected} onChange={setSelected} disabled={busy} />
    <label className="workflow-field"><span>Motif de rectification</span><textarea required maxLength={500} disabled={busy} value={motivation} onChange={(event) => setMotivation(event.target.value)} /></label>
    <button className="btn-secondary" disabled={busy || !motivation.trim()}>Enregistrer la rectification</button>
    {response.item_links.filter((link) => link.voided_at).map((link) => <p key={link.id}>Association annulée : {request.items.find((item) => item.id === link.item)?.label || link.item} · {link.reason}</p>)}
  </form></details>;
}

export function RequestResponsesPanel({ request, responses, assessments, documents, canEdit, onRefresh }: {
  request: ApiRequest; responses: ApiResponse[]; assessments: Record<string, ApiAssessment[]>; documents: ApiDocument[]; canEdit: boolean; onRefresh: () => Promise<unknown>;
}) {
  const action = useWorkflowAction(onRefresh);
  const [letter, setLetter] = useState(''); const [annexes, setAnnexes] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]); const [complement, setComplement] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [reference, setReference] = useState(''); const [sender, setSender] = useState(''); const [note, setNote] = useState('');
  const editable = canEdit && request.state === 'issued';
  const linked = new Set(responses.flatMap((row) => row.item_links.filter((link) => !link.voided_at).map((link) => link.item)));
  const scopedDocuments = documents.filter((doc) => doc.case === request.case);
  return <section className="workflow-card" aria-label="Réponses et appréciations individuelles" aria-busy={action.busy}>
    <h3>Réponses et appréciations individuelles</h3><WorkflowFeedback {...action} />
    {responses.length === 0 && <p>Aucune réponse enregistrée.</p>}
    {responses.map((row) => <article className="workflow-proof" key={row.id}>
      <strong>{row.external_reference || 'Courrier sans référence'} · {row.received_on} · {row.sender_name}</strong>
      <p>{row.note}</p><p>Éléments : {row.item_links.filter((link) => !link.voided_at).map((link) => request.items.find((item) => item.id === link.item)?.label || link.item).join(', ') || 'Aucun lien actif'}</p>
      {row.complement_of && <p>Complément de {responses.find((prior) => prior.id === row.complement_of)?.external_reference || row.complement_of}</p>}
      <DocumentLinks ids={[row.letter, ...row.annexes]} documents={scopedDocuments} />
      {editable && <ResponseLinksEditor key={`${row.id}/${row.version}`} response={row} request={request} busy={action.busy} onSave={(operation) => void action.run(operation, 'Associations rectifiées.')} />}
    </article>)}
    {editable && <details><summary>Enregistrer une réponse ou un complément</summary><form className="workflow-proof" onSubmit={(event) => {
      event.preventDefault(); void action.run(() => recordResponse(request, scopedDocuments, {
        letter, annexes, received_on: date, item_ids: selected, external_reference: reference, sender_name: sender, note,
        ...(complement ? { complement_of: complement } : {}),
      }), 'Réponse enregistrée.', () => { setLetter(''); setAnnexes([]); setSelected([]); setComplement(''); setReference(''); setSender(''); setNote(''); });
    }}>
      <p>Déposez les courriers et annexes dans Documents, puis sélectionnez les pièces acceptées.</p>
      <DocumentPicker documents={scopedDocuments} label="Courrier de réponse" value={letter} disabled={action.busy} onChange={(id) => { setLetter(id); setAnnexes(annexes.filter((value) => value !== id)); }} />
      <DocumentSelection documents={scopedDocuments} label="Annexes de la réponse" selected={annexes} onChange={setAnnexes} disabled={action.busy} exclude={[letter]} />
      <div className="workflow-fields">
        <label className="workflow-field"><span>Date de réception de la réponse</span><input type="date" required disabled={action.busy} value={date} onChange={(event) => setDate(event.target.value)} /></label>
        <label className="workflow-field"><span>Référence du courrier</span><input maxLength={120} disabled={action.busy} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
        <label className="workflow-field"><span>Expéditeur</span><input maxLength={240} disabled={action.busy} value={sender} onChange={(event) => setSender(event.target.value)} /></label>
        <label className="workflow-field"><span>Complément d’une réponse</span><select disabled={action.busy} value={complement} onChange={(event) => setComplement(event.target.value)}><option value="">Réponse indépendante</option>{responses.map((row) => <option key={row.id} value={row.id}>{row.external_reference || row.id} · {row.received_on}</option>)}</select></label>
      </div>
      <AssociationSelection label="Éléments fournis par ce courrier" items={request.items.map((item) => ({ id: item.id, label: `${item.number} · ${item.label}` }))} selected={selected} onChange={setSelected} disabled={action.busy} />
      <label className="workflow-field"><span>Note de réception</span><textarea maxLength={1000} disabled={action.busy} value={note} onChange={(event) => setNote(event.target.value)} /></label>
      <button className="btn-primary" disabled={action.busy || !letter || !selected.length}>Enregistrer la réponse</button>
    </form></details>}
    {request.items.map((item) => editable ? <ItemAssessmentEditor key={`${item.id}/${item.assessment_version}/${linked.has(item.id)}`} request={request} item={item} received={linked.has(item.id)} history={assessments[item.id] || []} busy={action.busy} onSave={(operation) => void action.run(operation, `Appréciation de l’élément ${item.number} enregistrée.`)} /> : <p key={item.id}>Élément {item.number} · {item.label} · {latestVersion(assessments[item.id] || [])?.reason || 'Aucune appréciation'}</p>)}
  </section>;
}
