import { isMockFallbackEnabled } from '../../services/apiClient';
import { AllergyItem, MedicalHistoryItem } from '../../types/patient';

/**
 * Resolves the effective patient ID for service queries.
 * In mock fallback mode, demo login users ('pat-1001', 'pat-1002') map to
 * the primary fixture patient ('pat-1') so all appointments, labs, bills,
 * prescriptions, and records remain consistent across screens.
 * Custom/newly registered patient IDs and live API users keep their real ID.
 */
export function resolveEffectivePatientId(userId?: string): string {
  if (!userId) return 'pat-1';
  if (
    isMockFallbackEnabled &&
    (userId === 'pat-1001' || userId === 'pat-1002')
  ) {
    return 'pat-1';
  }
  return userId;
}

export function formatCurrencyPKR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `PKR ${safeAmount.toLocaleString()}`;
}

/**
 * Extracts allergy entries saved via patientService.addMedicalHistory({ category: 'allergy' })
 * and merges them cleanly with existing AllergyItem records without duplicates.
 */
export function mergeAllergiesWithHistory(
  allergies: AllergyItem[],
  history: MedicalHistoryItem[],
  patientId: string
): AllergyItem[] {
  const allergyHistory = history.filter((item) => item.category === 'allergy');
  const seen = new Set(
    allergies.map((a) => `${a.allergen.trim().toLowerCase()}::${a.reaction.trim().toLowerCase()}`)
  );

  const merged: AllergyItem[] = [...allergies];

  for (const h of allergyHistory) {
    const cleanAllergen = h.title.replace(/\s*Allergy$/i, '').trim() || h.title;
    const severityMatch = h.description.match(/^(MILD|MODERATE|SEVERE)\s+severity/i);
    const severity = (
      severityMatch ? severityMatch[1].toLowerCase() : 'moderate'
    ) as AllergyItem['severity'];
    const reactionMatch = h.description.match(/Reaction:\s*(.+)$/i);
    const reaction = (reactionMatch ? reactionMatch[1] : h.description).trim();

    const dedupeKey = `${cleanAllergen.toLowerCase()}::${reaction.toLowerCase()}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      merged.unshift({
        id: h.id,
        patientId: h.patientId || patientId,
        allergen: cleanAllergen,
        severity,
        reaction,
        diagnosedDate: h.date,
      });
    }
  }

  return merged;
}
