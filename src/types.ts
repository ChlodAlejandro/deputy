import { Deputy } from './Deputy';
import moment from 'moment';
import 'types-mediawiki';

export type PromiseOrNot<T> = Promise<T> | T;
export type JQueryPromiseOrPromise<T> = JQuery.Promise<T> | Promise<T>;
export type ArrayOrNot<T> = T[] | T;
export type EnumValue<T> = T[keyof T];

declare global {
	interface Window {
		deputy: Deputy;
		deputyLang?: string;
		deputyWikiConfigOverride: Record<string, any>;
		moment: moment.Moment;
	}
}

export {};
