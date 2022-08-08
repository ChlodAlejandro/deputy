/**
 * An event that reflects a change in a given {{copied}} template
 * row.
 */
export default class RowChangeEvent extends Event {

	row: any;

	/**
	 * Creates a new RowChangeEvent.
	 *
	 * @param type The event type.
	 * @param row The changed row.
	 */
	constructor(
		type: 'rowAdd' | 'rowDelete',
		row: any
	) {
		super( type );
		this.row = row;
	}

}
