import { AttributionNoticePageGenerator } from '../ui/AttributionNoticePageGenerator';
import { AttributionNoticePageLayout } from '../ui/pages/AttributionNoticePageLayout';

export interface AttributionNoticeRowParent {
	addRow( row: any ): void;
	deleteRow( row: any ): void;
}

/**
 * An attribution notice's row or entry.
 */
export abstract class AttributionNoticeRow<T extends AttributionNoticeRowParent>
implements AttributionNoticePageGenerator {

	protected _parent: T;
	/**
	 * @return The parent of this attribution notice row.
	 */
	get parent(): T {
		return this._parent;
	}

	/**
	 * Sets the parent. Automatically moves this template from one
	 * parent's row set to another.
	 *
	 * @param newParent The new parent.
	 */
	set parent( newParent ) {
		this._parent.deleteRow( this );
		newParent.addRow( this );
		this._parent = newParent;
	}

	abstract generatePage( dialog: any ): AttributionNoticePageLayout;

	/**
	 * Clones this row.
	 *
	 * @param parent The parent of this new row.
	 * @return The cloned row
	 */
	clone( parent: T ): AttributionNoticeRow<T> {
		// noinspection JSCheckFunctionSignatures
		return new ( this.constructor as any )( this, parent );
	}

}
