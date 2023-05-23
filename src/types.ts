import { Deputy } from './Deputy';
import moment from 'moment';

export type PromiseOrNot<T> = Promise<T> | T;
export type JQueryPromiseOrPromise<T> = JQuery.Promise<T> | Promise<T>;
export type ArrayOrNot<T> = T[] | T;
export type EnumValue<T> = T[keyof T];

declare global {
	interface Window {
		deputy: Deputy;
		deputyLang?: string;
		moment: moment.Moment;
	}
}

export {};
