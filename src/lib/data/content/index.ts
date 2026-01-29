import yaml from 'js-yaml';
import aboutYaml from './about.yaml?raw';
import modalExamplesYaml from './modal-examples.yaml?raw';

export const aboutContent = yaml.load(aboutYaml) as any;

interface ModalExample {
  id: string;
  original: string;
  translations: Record<string, string>;
}

interface ModalExamplesData {
  examples: ModalExample[];
}

export const modalExamples = yaml.load(modalExamplesYaml) as ModalExamplesData;
