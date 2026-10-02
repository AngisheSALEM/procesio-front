import { useRef, useState } from 'react';

export function useWorkflowAction(onRefresh: () => Promise<unknown>) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  async function run(operation: () => Promise<unknown>, message: string, onSaved?: () => void) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError(''); setInfo('');
    let saved = false;
    try {
      await operation(); saved = true; onSaved?.();
      await onRefresh(); setInfo(message);
    } catch (cause) {
      setError(`${saved ? 'Enregistrement effectué, mais actualisation impossible : ' : ''}${cause instanceof Error ? cause.message : 'Opération impossible.'}`);
      if (!saved) await onRefresh().catch(() => undefined);
    } finally { pending.current = false; setBusy(false); }
  }
  return { busy, error, info, run };
}
