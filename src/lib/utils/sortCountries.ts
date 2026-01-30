import type { Country } from '$lib/types';
import type { CountryCode } from '$lib/types';

/**
 * Sort countries for display in dropdowns
 * - Auto-detected country first
 * - All others alphabetically
 */
export function sortCountriesForDisplay(
  countries: Country[],
  detectedCountryCode: CountryCode | null
): Country[] {
  const sorted = [...countries];

  // Separate into categories
  const detected = detectedCountryCode
    ? sorted.find((c) => c.code === detectedCountryCode)
    : null;
  const others = sorted
    .filter((c) => c.code !== detectedCountryCode)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Build result: [detected?, ...others]
  const result: Country[] = [];
  if (detected) {
    result.push(detected);
  }
  result.push(...others);

  return result;
}
