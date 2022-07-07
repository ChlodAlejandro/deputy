import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ExpandedRevisionData } from './api/ExpandedRevisionData';
import { ContributionSurveyRowStatus } from './models/ContributionSurveyRow';

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

export interface DeputyDiffStatus {
	hash: string,
	casePageID: number,
	page: string,
	status: ContributionSurveyRowStatus,
	comments: string
}

interface DeputyDiffStatusStore {
	/* `hash` */
	key: string;
	value: DeputyDiffStatus;
}

interface DeputyTagCacheStore {
	/* `key` */
	key: string;
	value: {
		key: string;
		value: string;
	}
}

interface DeputyDatabase extends DBSchema {
	keyval: DeputyKeyvalStore;
	casePageCache: DeputyCasePageCacheStore;
	diffCache: DeputyDiffCacheStore;
	diffStatus: DeputyDiffStatusStore;
	tagCache: DeputyTagCacheStore;
}

/**
 * Handles all browser-stored data for Deputy.
 */
export default class DeputyStorage {

	db: IDBPDatabase<DeputyDatabase>;
	tagCache: Record<string, string>;

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
							db.createObjectStore( 'diffStatus', {
								keyPath: 'hash'
							} );
							db.createObjectStore( 'tagCache', {
								keyPath: 'key'
							} );
						}
					};
					while ( currentVersion < newVersion ) {
						upgrader[ `${currentVersion}` ]();
						console.log(
							`[deputy] upgraded database from ${currentVersion} to ${
								currentVersion + 1
							}`
						);
						currentVersion++;
					}
				}
			}
		);

		await this.getTags();
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

	/**
	 * Get all MediaWiki tags and store them in the `tagCache` store.
	 */
	async getTags(): Promise<void> {
		this.tagCache = {};
		const tagCache = await window.deputy.storage.db.getAll( 'tagCache' );

		if (
			tagCache.length === 0 ||
			// 7 days
			Date.now() - ( await this.getKV( 'tagCacheAge' ) ?? 0 ) > 6048e5
		) {
			await window.deputy.wiki.getMessages( [ '*' ], {
				amenableparser: true,
				amincludelocal: true,
				amprefix: 'tag-'
			} ).then( ( messages: Record<string, string> ) => {
				for ( const key in messages ) {
					this.tagCache[ key ] = messages[ key ];
					mw.messages.set( key, messages[ key ] );
					this.db.put( 'tagCache', { key, value: messages[ key ] } );
				}
				this.setKV( 'tagCacheAge', Date.now() );
			} );
		} else {
			for ( const { key, value } of tagCache ) {
				this.tagCache[ key ] = value;
				mw.messages.set( key, value );
			}
		}
	}

}
