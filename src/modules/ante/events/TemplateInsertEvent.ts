import AttributionNotice from '../models/AttributionNotice';

/**
 * An event dispatched when a template inside a `CopiedTemplateEditorDialog` is inserted.
 */
export default class TemplateInsertEvent extends Event {

	template: AttributionNotice;

	/**
	 * @param template The template that was inserted
	 * @param eventInitDict
	 */
	constructor( template: AttributionNotice, eventInitDict?: EventInit ) {
		super( 'templateInsert', eventInitDict );
		this.template = template;
	}

}
