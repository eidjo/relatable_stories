import yaml from 'js-yaml';
import type { TimelineData } from '$lib/types';
import eventsYaml from './events.yaml?raw';

export const timelineData: TimelineData = yaml.load(eventsYaml) as TimelineData;
export const events = timelineData.events;
