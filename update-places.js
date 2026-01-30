#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV and parse it
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  // Skip header row
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma, handling quoted values
    const match = line.match(/^([^,]+),([^,]+),(.+)$/);
    if (match) {
      data.push({
        city: match[1].trim(),
        country: match[2].trim(),
        facility: match[3].trim()
      });
    }
  }

  return data;
}

// Group facilities by country and city
function groupByCountryAndCity(data, countryCodeMap) {
  const grouped = {};

  for (const item of data) {
    const countryCode = countryCodeMap[item.country];
    if (!countryCode) {
      console.warn(`Warning: Unknown country ${item.country}`);
      continue;
    }

    if (!grouped[countryCode]) {
      grouped[countryCode] = {};
    }

    const cityKey = item.city.toLowerCase().replace(/\s+/g, '-');
    if (!grouped[countryCode][cityKey]) {
      grouped[countryCode][cityKey] = [];
    }

    grouped[countryCode][cityKey].push(item.facility);
  }

  return grouped;
}

// Country code mapping
const countryCodeMap = {
  'USA': 'US',
  'UK': 'UK',
  'Czech Republic': 'CZ',
  'Canada': 'CA',
  'Germany': 'DE',
  'Australia': 'AU',
  'France': 'FR',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Iran': 'IR',
  'Sweden': 'SE',
  'Belgium': 'BE',
  'Brazil': 'BR',
  'Portugal': 'PT',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Greece': 'GR',
  'Romania': 'RO'
};

// Parse all CSV files
console.log('Reading CSV files...');
const hospitals = parseCSV('hospitals.csv');
const morgues = parseCSV('morgues.csv');
const prisons = parseCSV('prisons.csv');
const policeStations = parseCSV('police-statations.csv');

console.log(`Found ${hospitals.length} hospitals`);
console.log(`Found ${morgues.length} morgues`);
console.log(`Found ${prisons.length} prisons`);
console.log(`Found ${policeStations.length} police stations`);

// Group by country and city
const hospitalsByCity = groupByCountryAndCity(hospitals, countryCodeMap);
const morguesByCity = groupByCountryAndCity(morgues, countryCodeMap);
const prisonsByCity = groupByCountryAndCity(prisons, countryCodeMap);
const policeByCity = groupByCountryAndCity(policeStations, countryCodeMap);

// Read the current places.yaml
console.log('Reading places.yaml...');
const placesPath = path.join(__dirname, 'src/lib/data/contexts/places.yaml');
let placesContent = fs.readFileSync(placesPath, 'utf-8');
const lines = placesContent.split('\n');

// Process the YAML line by line
let updatedLines = [];
let currentCountry = null;
let currentCity = null;
let indentLevel = 0;
let skipUntilNextProperty = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect country code (top level, no indent)
  if (line.match(/^[A-Z]{2}:$/)) {
    currentCountry = line.replace(':', '');
    currentCity = null;
    updatedLines.push(line);
    skipUntilNextProperty = false;
    continue;
  }

  // Detect city id
  const cityMatch = line.match(/^(\s+)- id: (.+)$/);
  if (cityMatch) {
    indentLevel = cityMatch[1].length;
    currentCity = cityMatch[2];
    updatedLines.push(line);
    skipUntilNextProperty = false;
    continue;
  }

  // Detect hospitals, prisons, police-stations, or morgues section
  const sectionMatch = line.match(/^(\s+)(hospitals|prisons|police-stations|morgues):$/);
  if (sectionMatch && currentCountry && currentCity) {
    const indent = sectionMatch[1];
    const section = sectionMatch[2];

    updatedLines.push(line);

    // Find the data for this city
    let facilities = [];
    if (section === 'hospitals' && hospitalsByCity[currentCountry] && hospitalsByCity[currentCountry][currentCity]) {
      facilities = hospitalsByCity[currentCountry][currentCity];
    } else if (section === 'prisons' && prisonsByCity[currentCountry] && prisonsByCity[currentCountry][currentCity]) {
      facilities = prisonsByCity[currentCountry][currentCity];
    } else if (section === 'police-stations' && policeByCity[currentCountry] && policeByCity[currentCountry][currentCity]) {
      facilities = policeByCity[currentCountry][currentCity];
    } else if (section === 'morgues' && morguesByCity[currentCountry] && morguesByCity[currentCountry][currentCity]) {
      facilities = morguesByCity[currentCountry][currentCity];
    }

    // Add the facilities
    for (const facility of facilities) {
      // Use single quotes for strings to preserve apostrophes correctly
      updatedLines.push(`${indent}  - '${facility.replace(/'/g, "''")}'`);
    }

    // Skip the old entries until the next property
    skipUntilNextProperty = true;
    continue;
  }

  // If we're skipping, check if we hit the next property at the same indent level
  if (skipUntilNextProperty) {
    // Check if this is a new property at the same or lower indent level (not a list item)
    const propertyMatch = line.match(/^(\s+)([a-z-]+):/);
    if (propertyMatch) {
      const lineIndent = propertyMatch[1];
      // If indent is same as or less than the section indent, stop skipping
      if (lineIndent.length <= indentLevel) {
        skipUntilNextProperty = false;
        updatedLines.push(line);
      }
    } else if (line.match(/^[A-Z]{2}:$/) || line.match(/^(\s+)- id:/)) {
      // New country or city section
      skipUntilNextProperty = false;
      updatedLines.push(line);
    } else if (line.trim() === '' || line.match(/^#/)) {
      // Keep blank lines and comments
      updatedLines.push(line);
    }
    // Otherwise skip the line
    continue;
  }

  // Keep all other lines
  updatedLines.push(line);
}

// Write the updated content
console.log('Writing updated places.yaml...');
fs.writeFileSync(placesPath, updatedLines.join('\n'));

console.log('Done! Updated places.yaml with CSV data.');
