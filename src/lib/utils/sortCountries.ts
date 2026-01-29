import type { Country } from '$lib/types';
import type { CountryCode } from '$lib/types';

/**
 * Sort countries for display in dropdowns
 * - Auto-detected country first
 * - Iran second
 * - All others alphabetically
 */
export function sortCountriesForDisplay(
  countries: Country[],
  detectedCountryCode: CountryCode | null
): Country[] {
  const sorted = [...countries];

  // Separate into categories
  const iran = sorted.find((c) => c.code === 'IR');
  const detected = detectedCountryCode
    ? sorted.find((c) => c.code === detectedCountryCode && c.code !== 'IR')
    : null;
  const others = sorted
    .filter((c) => c.code !== 'IR' && c.code !== detectedCountryCode)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build result: [detected?, iran, ...others]
  const result: Country[] = [];
  if (detected) {
    result.push(detected);
  }
  if (iran) {
    result.push(iran);
  }
  result.push(...others);

  return result;
}
