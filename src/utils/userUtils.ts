import type { UserAccount } from '../types';

/**
 * Détermine si un élément (dossier, renseignement, acte) est formellement assigné à l'utilisateur connecté.
 * - Si l'utilisateur est administrateur ('admin'), il a accès à tous les éléments.
 * - Si l'utilisateur est enquêteur ('enqueteur'), il n'a accès qu'aux éléments où son identité
 *   (prénom + nom, ex: "Marc Kabamba") figure comme responsable, coté/assigné, ou membre d'équipe.
 */
export function isAssignedToUser(
  assignee: string | null | undefined,
  team: string[] | null | undefined,
  user: UserAccount
): boolean {
  if (!user || user.role === 'admin') return true;

  const prenom = (user.prenom || '').toLowerCase().trim();
  const nom = (user.nom || '').toLowerCase().trim();

  const matches = (target?: string | null): boolean => {
    if (!target) return false;
    const t = target.toLowerCase();
    // Doit contenir le prénom et le nom pour éviter les faux positifs (ex: Mireille Kabamba vs Marc Kabamba)
    return t.includes(nom) && t.includes(prenom);
  };

  if (matches(assignee)) return true;
  if (team && Array.isArray(team) && team.some((member) => matches(member))) return true;

  return false;
}
