import unwrapWidget from '../../../util/unwrapWidget';
import DeputyMessageWidget from '../../../ui/shared/DeputyMessageWidget';
import { h } from 'tsx-dom';

/**
 *
 */
export default class HiddenViolationUI {

	private vioElement: HTMLElement;

	/**
	 * @param el
	 */
	constructor( el: HTMLElement ) {
		if ( !el.classList.contains( 'copyvio' ) && !el.hasAttribute( 'data-copyvio' ) ) {
			throw new Error( 'Attempted to create HiddenViolationUI on non-copyvio element.' );
		}
		this.vioElement = el;
	}

	/**
	 *
	 */
	attach(): void {
		this.vioElement.insertAdjacentElement(
			'beforebegin',
			<div class="deputy dp-hiddenVio">
				<div class="dp-hiddenVio-message">{ this.renderMessage() }</div>
				<div class="dp-hiddenVio-actions">{ this.renderButton() }</div>
			</div>
		);
		this.vioElement.classList.add( 'deputy-upgraded' );
	}

	/**
	 * @return A message widget.
	 */
	renderMessage(): HTMLElement {
		return unwrapWidget( DeputyMessageWidget( {
			type: 'warning',
			label: mw.msg( 'deputy.ia.hiddenVio' )
		} ) );
	}

	/**
	 * @return A button.
	 */
	renderButton(): HTMLElement {
		const button = new OO.ui.ToggleButtonWidget( {
			icon: 'eye',
			label: mw.msg( 'deputy.ia.hiddenVio.show' )
		} );

		button.on( 'change', ( shown: boolean ) => {
			button.setLabel(
				shown ? mw.msg( 'deputy.ia.hiddenVio.hide' ) : mw.msg( 'deputy.ia.hiddenVio.show' )
			);
			button.setIcon(
				shown ? 'eyeClosed' : 'eye'
			);
			this.vioElement.appendChild( <div style="clear: both;"/> );
			this.vioElement.classList.toggle( 'deputy-show', shown );
		} );

		return unwrapWidget( button );
	}

}
