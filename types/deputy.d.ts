declare global {
	interface Window {
		deputy: any;
		idb: typeof import("idb")
	}
}

export {};
