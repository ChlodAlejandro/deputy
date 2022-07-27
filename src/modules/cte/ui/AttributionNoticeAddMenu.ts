import unwrapWidget from '../../../util/unwrapWidget';
import {
	attributionNoticeTemplatePages,
	SupportedAttributionNoticeType
} from '../models/WikiAttributionNotices';
import CTEParsoidDocument from '../models/CTEParsoidDocument';

/**
 * Renders a MenuLayout responsible for displaying analysis options or tools.
 */
export default class AttributionNoticeAddMenu {

	document: CTEParsoidDocument;
	baseWidget: any;
	menuSelectWidget: any;

	/**
	 * @param document
	 * @param baseWidget
	 */
	constructor( document: CTEParsoidDocument, baseWidget: any ) {
		this.document = document;
		this.baseWidget = baseWidget;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const menuItems: Map<any, SupportedAttributionNoticeType> = new Map();

		const menuSelectWidget = new OO.ui.MenuSelectWidget( {
			hideWhenOutOfView: false,
			verticalPosition: 'below',
			horizontalPosition: 'start',
			widget: this.baseWidget,
			$floatableContainer: this.baseWidget.$element,
			items: Object.keys( attributionNoticeTemplatePages ).map(
				( key: SupportedAttributionNoticeType ) => {
					const item = new OO.ui.MenuOptionWidget( {
						data: key,
						icon: 'add',
						// Will automatically use template name as
						// provided by WikiAttributionNotices.
						label: `{{${attributionNoticeTemplatePages[ key ]}}}`,
						flags: [ 'progressive' ]
					} );

					menuItems.set( item, key );
					return item;
				}
			)
		} );

		menuSelectWidget.on( 'select', () => {
			const selected = menuSelectWidget.findSelectedItem();
			if ( selected ) {
				const type: SupportedAttributionNoticeType = selected.getData();
				const spot = this.document.findNoticeSpot( type );
				this.document.insertNewNotice( type, spot );
				// Clear selections.
				menuSelectWidget.selectItem();
			}
		} );

		// Disables clipping (allows the menu to be wider than the button)
		menuSelectWidget.toggleClipping( false );

		this.baseWidget.on( 'click', () => {
			menuSelectWidget.toggle( true );
		} );

		return unwrapWidget( menuSelectWidget );
	}

}
