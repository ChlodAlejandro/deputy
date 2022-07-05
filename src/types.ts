import { Deputy } from './Deputy';

export type PromiseOrNot<T> = Promise<T> | T;
export type ArrayOrNot<T> = T[] | T;

interface OOEventEmitter {
	connect(
		context: any,
		methods: Record<string, ArrayOrNot<( ...args: any[] ) => void | string>>
	): OOEventEmitter;
	disconnect(
		context: any,
		methods?: Record<string, ArrayOrNot<( ...args: any[] ) => void | string>>
	): OOEventEmitter;
	emit( event: string, ...args: any[] ): boolean;
	emitThrow( event: string, ...args: any[] ): boolean;
	off( event: string, method?: ( ...args: any[] ) => void | string, context?: any ):
		OOEventEmitter;
	on( event: string, method?: ( ...args: any[] ) => void, args?: any[], context?: any ):
		OOEventEmitter;
	once( event: string, listener?: ( ...args: any[] ) => void ): OOEventEmitter;
}

declare global {
	// OOjs/OOUI global.
	const OO: any & {
		EventEmitter(): OOEventEmitter;
		ui: any & {
			confirm( message: string, options?: any ): JQuery.Promise<boolean>;
		}
	};

	interface Window {
		OO: any;
		deputy: Deputy;
		deputyLang?: string | Record<string, string>;
	}
}

export {};
