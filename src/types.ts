import { Deputy } from './Deputy';

export type PromiseOrNot<T> = Promise<T> | T;
export type JQueryPromiseOrPromise<T> = JQuery.Promise<T> | Promise<T>;
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

/**
 * A Process is a list of steps that are called in sequence. The step can be a number,
 * a promise (jQuery, native, or any other “thenable”), or a function.
 *
 * @see https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/OO.ui.Process
 * @license MIT
 * @author OOUI Team and other contributors
 */
declare class Process {
	/**
	 *
	 */
	constructor(
		step: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	);
	/**
	 * Add step to the end of the process.
	 */
	next(
		step: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	): Process;
	/**
	 * Add step to the beginning of the process.
	 */
	first(
		step: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	): Process;
	/**
	 * Start the process.
	 */
	execute(): JQuery.Promise<any>;
}

declare global {
	// OOjs/OOUI global.
	const OO: any & {
		EventEmitter(): OOEventEmitter;
		ui: any & {
			confirm( message: string, options?: any ): JQuery.Promise<boolean>;
			Process: Process;
		}
	};

	interface Window {
		OO: any;
		deputy: Deputy;
		deputyLang?: string | Record<string, string>;
	}
}

export {};
