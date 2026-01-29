import yaml from 'js-yaml';
import aboutYaml from './about.yaml?raw';

export const aboutContent = yaml.load(aboutYaml) as any;
