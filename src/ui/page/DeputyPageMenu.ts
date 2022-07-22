import { DeputyUIElement } from '../DeputyUIElement';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyPageToolbar from './DeputyPageToolbar';
import { PromiseOrNot } from '../../types';

export interface DeputyPageMenuOption {
	label: string;
		icon?: string;
		condition?: ( toolbar: DeputyPageToolbar ) => boolean;
		action: ( toolbar: DeputyPageToolbar ) => PromiseOrNot<void>;
}

/**
 * Renders a MenuLayout responsible for displaying analysis options or tools.
 */
export default class DeputyPageMenu implements DeputyUIElement {

	options: DeputyPageMenuOption[];
	toolbar: DeputyPageToolbar;
	baseWidget: any;
	menuSelectWidget: any;

	/**
	 * @param options
	 * @param toolbar
	 * @param baseWidget
	 */
	constructor( options: DeputyPageMenuOption[], toolbar: DeputyPageToolbar, baseWidget: any ) {
		this.options = options;
		this.toolbar = toolbar;
		this.baseWidget = baseWidget;
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const menuItems: Map<any, DeputyPageMenuOption> = new Map();

		const menuSelectWidget = new OO.ui.MenuSelectWidget( {
			autoHide: false,
			hideWhenOutOfView: false,
			verticalPosition: 'above',
			horizontalPosition: 'start',
			widget: this.baseWidget,
			$floatableContainer: this.baseWidget.$element,
			items: this.options.map(
				( option, i ) => {
					const item = new OO.ui.MenuOptionWidget( {
						data: i,
						disabled: option.condition ? !( option.condition( this.toolbar ) ) : false,
						icon: option.icon,
						label: option.label
					} );

					menuItems.set( item, option );
					return item;
				}
			)
		} );

		menuSelectWidget.on( 'select', () => {
			const selected = menuSelectWidget.findSelectedItem();
			if ( selected ) {
				this.options[ selected.getData() ].action( this.toolbar );
				// Clear selections.
				menuSelectWidget.selectItem();
				this.baseWidget.setValue( false );
			}
		} );

		// Disables clipping (allows the menu to be wider than the button)
		menuSelectWidget.toggleClipping( false );

		this.baseWidget.on( 'change', ( toggled: boolean ) => {
			// Recalculate disabled condition
			menuItems.forEach( ( option, item ) => {
				item.setDisabled(
					option.condition ? !( option.condition( this.toolbar ) ) : false
				);
			} );

			menuSelectWidget.toggle( toggled );
		} );

		return unwrapWidget( menuSelectWidget );
	}

}
