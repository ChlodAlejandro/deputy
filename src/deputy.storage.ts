import type { DBSchema, IDBPDatabase } from 'idb';

/**
 * General key-value store. Used for storing single-variable data
 * (currently active case, etc.)
 */
interface DeputyKeyvalStore {
	/* `key` */
	key: string;
	value: {
		key: string;
		value: any;
	};
}

/**
 * Case cache store. Used to store cases and relevant case information.
 */
interface DeputyCaseCacheStore {
	/* `case` */
	key: string;
	value: {
		/** Title of the page */
		case: string;
		/** Last time that a session was active on this case */
		lastActive: number;
		/** Last active section IDs for either autostart or "pick up where you left off" */
		lastActiveSection: null|number[];
	}
}

interface DeputyTitleCacheStore {
	/* `id` */
	key: string;
	value: {
		/** sha1(page + newline + case) */
		id: string;
		/** Title of the page. */
		page: string;
		/** Case title. */
		case: string;
		/** Case section */
		caseSection: number;
		/** Case subpage */
		caseSubpage: string;
	}
}

interface DeputyDiffCacheStore {
	/* `revid` */
	key: number;
	value: {
		/** Revision ID of this revision. */
		revid: string;
		/** Revision ID of the parent of this revision (previous revision) */
		parentid: number;
		/** Timestamp of this revision */
		timestamp: Date;
		/** User who made this revision */
		user: string;
		/** New and old sizes of this revision */
		size: {
			new: number;
			old: number;
		};
		/** The HTML edit summary for this revision */
		parsedcomment: string;
		/** Tags of this revision */
		tags: string[];
		/** Supplied if the comment does not have a revision */
		commenthidden?: '';
	}
}

interface DeputyDatabase extends DBSchema {
	keyval: DeputyKeyvalStore;
	caseCache: DeputyCaseCacheStore;
	titleCache: DeputyTitleCacheStore;
	diffCache: DeputyDiffCacheStore;
}

/**
 * Handles all browser-stored data for Deputy.
 */
class DeputyStorage {

	db: IDBPDatabase<DeputyDatabase>;

	/**
	 * Initialize the Deputy IndexedDB database.
	 */
	async init() {
		this.db = await window.idb.openDB<DeputyDatabase>(
			'us-deputy', 1, {
				upgrade( db, oldVersion, newVersion ) {
					let currentVersion = oldVersion;
					const upgrader: Record<string, () => void> = {
						0: () => {
							db.createObjectStore( 'keyval', {
								keyPath: 'key'
							} );
							db.createObjectStore( 'caseCache', {
								keyPath: 'case'
							} );
							db.createObjectStore( 'titleCache', {
								keyPath: 'id'
							} );
							db.createObjectStore( 'diffCache', {
								keyPath: 'revid'
							} );
						}
					};
					while ( currentVersion < newVersion ) {
						upgrader[ `${currentVersion}` ]();
						console.log(
							`[deputy] upgraded database from ${currentVersion} to ${currentVersion + 1}`
						);
						currentVersion++;
					}
				}
			}
		);
	}

}

window.deputy.constructor.DeputyStorage = DeputyStorage;
