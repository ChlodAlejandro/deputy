import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ExpandedRevisionData } from './api/ExpandedRevisionData';

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
 * Case page cache store. Used to store case pages and relevant case information.
 * Each case page is a different entry here, meaning there may be multiple entries
 * for different "pages" of a case (for particularly large cases).
 */
interface DeputyCasePageCacheStore {
	/* `pageID` */
	key: number;
	value: {
		/** Page ID of the case page */
		pageID: number;
		/** Last time that a session was active on this case */
		lastActive: number;
		/** Last active section IDs for either autostart or "pick up where you left off" */
		lastActiveSections: string[];
	};
}

interface DeputyDiffCacheStore {
	/* `revid` */
	key: number;
	value: ExpandedRevisionData;
}

interface DeputyDatabase extends DBSchema {
	keyval: DeputyKeyvalStore;
	casePageCache: DeputyCasePageCacheStore;
	diffCache: DeputyDiffCacheStore;
}

/**
 * Handles all browser-stored data for Deputy.
 */
export default class DeputyStorage {

	db: IDBPDatabase<DeputyDatabase>;

	/**
	 * Initialize the Deputy IndexedDB database.
	 *
	 * @return {void} A promise that resolves when a database connection is established.
	 */
	async init(): Promise<void> {
		this.db = await openDB<DeputyDatabase>(
			'us-deputy', 1, {
				upgrade( db, oldVersion, newVersion ) {
					let currentVersion = oldVersion;
					const upgrader: Record<string, () => void> = {
						0: () => {
							db.createObjectStore( 'keyval', {
								keyPath: 'key'
							} );
							db.createObjectStore( 'casePageCache', {
								keyPath: 'pageID'
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

	/**
	 * Get a value in the `keyval` store.
	 *
	 * @param key The key to get
	 */
	async getKV( key: string ): Promise<any> {
		return window.deputy.storage.db.get( 'keyval', key )
			.then(
				( keyPair ) =>
					keyPair?.value as any
			);
	}

	/**
	 * Set a value in the `keyval` store.
	 *
	 * @param key The key to set
	 * @param value The value to set
	 */
	async setKV( key: string, value: any ): Promise<true> {
		return window.deputy.storage.db.put( 'keyval', {
			key: key,
			value: value
		} ).then( () => true );
	}

}
