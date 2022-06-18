import { Deputy } from './Deputy';

declare global {
	// OOjs/OOUI global.
	const OO: any;

	interface Window {
		OO: any;
		deputy: Deputy;
	}
}

export {};
