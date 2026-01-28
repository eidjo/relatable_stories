export type ActionType = 'social' | 'education' | 'political' | 'donate' | 'advocacy' | 'local';

export interface ActionLink {
  title?: string;
  url: string;
  platform?: string;
}

export interface Action {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  links: ActionLink[];
}

export interface GlobalActions {
  actions: Action[];
}

export interface CountryActions {
  [countryCode: string]: Action[];
}
