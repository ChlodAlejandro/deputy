import { Deputy } from './Deputy';
import moment from 'moment';
import 'types-mediawiki/mw';
import 'types-mediawiki/jquery';

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

	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace mw {

		const widgets: any;

	}
}

export {};
