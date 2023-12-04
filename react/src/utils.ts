import { Props } from './Element';

export const isEvent = (key: string) => key.startsWith('on');
export const isProperty = (key: string) => key !== 'children';
export const isNew = (prev: Props, next: Props) => (key: string) =>
  prev[key] !== next[key];
export const isGone = (prev: Props, next: Props) => (key: string) =>
  !(key in next);
