export type CountryCode = string;

export interface Country {
  code: CountryCode;
  name: string;
  population: number;
  currency: string;
  'currency-symbol': string;
  'rial-to-local': number;
}

export interface NameMappings {
  [country: string]: {
    male: string[];
    female: string[];
    neutral: string[];
  };
}

export interface PlaceMappings {
  [country: string]: {
    'city-small'?: string[];
    'city-medium'?: string[];
    'city-large'?: string[];
    'landmark-protest'?: string[];
    'government-facility'?: string[];
    university?: string[];
    [key: string]: string[] | undefined;
  };
}

export interface OccupationMappings {
  [country: string]: {
    'working-class-skilled'?: string[];
    'working-class-unskilled'?: string[];
    'middle-class'?: string[];
    professional?: string[];
    [key: string]: string[] | undefined;
  };
}

export interface ContextData {
  countries: Country[];
  names: NameMappings;
  places: PlaceMappings;
  occupations?: OccupationMappings;
}

export interface TranslationContext {
  country: CountryCode;
  countryData: Country;
  names: NameMappings[string];
  places: PlaceMappings[string];
  occupations?: OccupationMappings[string];
}
