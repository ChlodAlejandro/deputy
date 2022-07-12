import { DeputyUIElement } from '../DeputyUIElement';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyPageToolbar from './DeputyPageToolbar';
import EarwigCopyvioDetector from '../../wiki/EarwigCopyvioDetector';
import { PromiseOrNot } from '../../types';

interface DeputyPageAnalysisMenuOption {
	label: string;
		icon?: string;
		condition?: () => boolean;
		action: () => PromiseOrNot<void>;
}

/**
 * Renders the MenuLayout responsible for displaying analysis options.
 */
export default class DeputyPageAnalysisMenu implements DeputyUIElement {

	toolbar: DeputyPageToolbar;
	baseWidget: any;
	menuSelectWidget: any;

	/**
	 *
	 * @param toolbar
	 * @param baseWidget
	 */
	constructor( toolbar: DeputyPageToolbar, baseWidget: any ) {
		this.toolbar = toolbar;
		this.baseWidget = baseWidget;
	}

	/**
	 * Options to present for this menu.
	 */
	readonly options: DeputyPageAnalysisMenuOption[] = [
		{
			icon: 'eye',
			label: "Earwig's Copyvio Detector (latest)",
			action: async () => {
				const url = await EarwigCopyvioDetector.getUrl( this.toolbar.row.title );
				window.open( url, '_blank', 'noopener' );

				if ( url == null ) {
					mw.notify(
						mw.message( 'deputy.session.page.earwigUnsupported' ).text(),
						{
							type: 'error'
						}
					);
				} else {
					window.open( url, '_blank', 'noopener' );
				}
			}
		},
		{
			icon: 'eye',
			label: "Earwig's Copyvio Detector (revision)",
			condition: () => this.toolbar.revision != null,
			action: async () => {
				const url = await EarwigCopyvioDetector.getUrl( this.toolbar.revision );

				if ( url == null ) {
					mw.notify(
						mw.message( 'deputy.session.page.earwigUnsupported' ).text(),
						{
							type: 'error'
						}
					);
				} else {
					window.open( url, '_blank', 'noopener' );
				}
			}
		}
	];

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		const menuSelectWidget = new OO.ui.MenuSelectWidget( {
			autoHide: false,
			hideWhenOutOfView: false,
			verticalPosition: 'above',
			horizontalPosition: 'start',
			widget: this.baseWidget,
			$floatableContainer: this.baseWidget.$element,
			items: this.options.map( ( option, i ) => new OO.ui.MenuOptionWidget( {
				data: i,
				disabled: option.condition ? !( option.condition() ) : false,
				icon: option.icon,
				label: option.label
			} ) )
		} );

		menuSelectWidget.on( 'select', () => {
			const selected = menuSelectWidget.findSelectedItem();
			if ( selected ) {
				this.options[ selected.getData() ].action();
				// Clear selections.
				menuSelectWidget.selectItem();
				this.baseWidget.setValue( false );
			}
		} );

		// Disables clipping (allows the menu to be wider than the button)
		menuSelectWidget.toggleClipping( false );

		this.baseWidget.on( 'change', ( toggled: boolean ) => {
			menuSelectWidget.toggle( toggled );
		} );

		return unwrapWidget( menuSelectWidget );
	}

}
