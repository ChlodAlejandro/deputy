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
	baseWidget: OO.ui.ButtonWidget;
	menuSelectWidget: OO.ui.MenuSelectWidget;

	/**
	 * @param document
	 * @param baseWidget
	 */
	constructor( document: CTEParsoidDocument, baseWidget: OO.ui.ButtonWidget ) {
		this.document = document;
		this.baseWidget = baseWidget;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const menuItems: Map<OO.ui.MenuOptionWidget, SupportedAttributionNoticeType> = new Map();

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
			// Not a multiselect menu; cast the result to OptionWidget.
			const selected = menuSelectWidget.findSelectedItem() as OO.ui.OptionWidget;
			if ( selected ) {
				const type = selected.getData() as SupportedAttributionNoticeType;
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
