/**
 * Utilitaire de formatage des dates au format français standard : JJ/MM/AAAA
 */
export function formatDate(dateStr?: string | null, includeTime: boolean = false): string {
  if (!dateStr || dateStr.trim() === '') {
    return '—';
  }

  const clean = dateStr.trim();

  // Si déjà au format JJ/MM/AAAA (ex: 27/09/2026)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) {
    return clean;
  }

  // Format avec heure (ex: 2026-08-12 10:15:22 ou 2026-08-12T10:15)
  const timeMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})/);
  if (timeMatch) {
    const [, year, month, day, hours, minutes] = timeMatch;
    const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    return includeTime ? `${formattedDate} à ${hours}:${minutes}` : formattedDate;
  }

  // Format ISO direct YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  // Parsing Date générique
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    if (includeTime) {
      const hours = String(parsed.getHours()).padStart(2, '0');
      const minutes = String(parsed.getMinutes()).padStart(2, '0');
      return `${formattedDate} à ${hours}:${minutes}`;
    }
    return formattedDate;
  }

  return clean;
}
