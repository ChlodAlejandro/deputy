import { AttributionNoticePageGenerator } from '../ui/AttributionNoticePageGenerator';
import { AttributionNoticePageLayout } from '../ui/pages/AttributionNoticePageLayout';
import { CTEParsoidTransclusionTemplateNode } from './CTEParsoidTransclusionTemplateNode';

export interface AttributionNoticeRowParent {
	id: string;
	name: string;
	node: CTEParsoidTransclusionTemplateNode;
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
	 * A unique name for this row.
	 * Derived from the Parsoid `about` for its node and a unique identifier.
	 */
	readonly name: string;
	/**
	 * A unique ID for this template.
	 * Derived from the template name, its Parsoid `about`, and a unique identifier.
	 */
	readonly id: string;
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

	/**
	 *
	 * @param parent
	 */
	protected constructor( parent: T ) {
		this._parent = parent;

		const r = window.btoa( ( Math.random() * 10000 ).toString() ).slice( 0, 6 );
		this.name = this.parent.name + '#' + r;
		this.id = window.btoa( parent.node.getTarget().wt ) + '-' + this.name;
	}

	abstract generatePage( dialog: any ): AttributionNoticePageLayout;

	/**
	 * Clones this row.
	 *
	 * @param parent The parent of this new row.
	 * @return The cloned row
	 */
	clone( parent: T ): AttributionNoticeRow<T> {
		// Odd constructor usage here allows cloning from subclasses without having
		// to re-implement the cloning function.
		// noinspection JSCheckFunctionSignatures
		return new ( this.constructor as any )( this, parent );
	}

}
