export type CountryCode = string;

export interface Country {
  code: CountryCode;
  name: string;
  population: number;
  currency: string;
  'currency-symbol': string;
  'rial-to-local': number;
  timezones: string[];
}

export interface NameMappings {
  [country: string]: {
    male: string[];
    female: string[];
    neutral: string[];
  };
}