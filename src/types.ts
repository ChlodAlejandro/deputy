import { Deputy } from './Deputy';

declare global {
	// OOjs/OOUI global.
	const OO: any;

	interface Window {
		OO: any;
		deputy: Deputy;
		deputyLang?: string | Record<string, string>;
	}
}

export type PromiseOrNot<T> = Promise<T> | T;

export {};
