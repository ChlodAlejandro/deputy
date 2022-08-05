/* eslint-disable jsdoc/require-jsdoc */
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
	constructor(
		step?: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	);
	next(
		step: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	): Process;
	first(
		step: number | JQueryPromiseOrPromise<any> | ( ( data: any ) => any ),
		context?: any
	): Process;
	execute(): JQuery.Promise<any>;
}

export declare class OOUIBookletLayout {
	pages: Record<string, any>;
	$element: JQuery<any>;

	constructor( config: any );
	on( event: string, callback: ( any: any ) => any ): void;
	off( event: string, callback: ( any: any ) => any ): void;
	addPages( pages: any[], index?: number ): OOUIBookletLayout;
	removePages( pages: any[] ): OOUIBookletLayout;
	getPage( name: string ): any;
	clearPages(): void;
	getCurrentPage(): any /* PageLayout */;
	/**
	 * Set the current page by symbolic name
	 *
	 * @param name Symbolic name of page
	 */
	setPage( name: string ): void;
}

declare global {
	// OOjs/OOUI global.
	const OO: any & {
		EventEmitter(): OOEventEmitter;
		ui: any & {
			confirm( message: string, options?: any ): JQuery.Promise<boolean>;
			alert( message: string, options?: any ): JQuery.Promise<boolean>;
			Process: typeof Process;
			Error: any;
			BookletLayout: typeof OOUIBookletLayout;
		}
	};

	interface Window {
		OO: any;
		deputy: Deputy;
		deputyLang?: string | Record<string, string>;
	}
}

export {};
