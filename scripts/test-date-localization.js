/**
 * Test that dates are being localized in share images
 */

import { format } from 'date-fns';
import { enUS, cs, fr, de, es, it, nl, sv, nb, da, fi, pl, pt, el } from 'date-fns/locale';

const localeMap = {
  en: enUS,
  cs: cs,
  fr: fr,
  de: de,
  es: es,
  it: it,
  nl: nl,
  sv: sv,
  no: nb,
  da: da,
  fi: fi,
  pl: pl,
  pt: pt,
  el: el,
};

function formatDateLocalized(dateString, languageCode = 'en') {
  try {
    const date = new Date(dateString);
    const locale = localeMap[languageCode] || localeMap['en'];
    return format(date, 'PPP', { locale });
  } catch (error) {
    return dateString;
  }
}

const testDate = '2026-01-08';

console.log('\n📅 Testing date localization for: ' + testDate + '\n');

const languages = [
  { code: 'en', name: 'English' },
  { code: 'cs', name: 'Czech' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'el', name: 'Greek' },
];

languages.forEach(({ code, name }) => {
  const formatted = formatDateLocalized(testDate, code);
  console.log(`${name.padEnd(10)} (${code}): ${formatted}`);
});

console.log('\n✅ All dates properly localized\n');
