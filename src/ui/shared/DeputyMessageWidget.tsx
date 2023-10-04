import { ComponentChild, h } from 'tsx-dom';
import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import removeElement from '../../util/removeElement';

interface DeputyMessageWidgetOptions extends OO.ui.MessageWidget.ConfigOptions {
	title?: string;
	message?: ComponentChild;
	closable?: boolean;
	actions?: ( OO.ui.Element | HTMLElement )[];
}

let InternalDeputyMessageWidget: any;

/**
 * Initializes the process element.
 */
function initDeputyMessageWidget() {
	InternalDeputyMessageWidget = class DeputyMessageWidget extends OO.ui.MessageWidget {

		data: any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: DeputyMessageWidgetOptions ) {
			super( config );
			this.$element.addClass( 'dp-messageWidget' );

			const elLabel = this.$label[ 0 ];
			if ( !config.label ) {
				if ( config.title ) {
					elLabel.appendChild(
						<b style={{ display: 'block' }}>{ config.title }</b>
					);
				}
				if ( config.message ) {
					elLabel.appendChild(
						<p class="dp-messageWidget-message">{ config.message }</p>
					);
				}
			}
			if ( config.actions || config.closable ) {
				const actionContainer = <div class="dp-messageWidget-actions" />;
				for ( const action of ( config.actions ?? [] ) ) {
					if ( action instanceof OO.ui.Element ) {
						actionContainer.appendChild( unwrapWidget( action ) );
					} else {
						actionContainer.appendChild( action );
					}
				}
				if ( config.closable ) {
					const closeButton = new OO.ui.ButtonWidget( {
						label: mw.msg( 'deputy.dismiss' )
					} );
					closeButton.on( 'click', () => {
						removeElement( unwrapWidget( this ) );
						this.emit( 'close' );
					} );
					actionContainer.appendChild( unwrapWidget( closeButton ) );
				}
				elLabel.appendChild( actionContainer );
			}
		}

	};
}

/**
 * Creates a new DeputyMessageWidget. This is an extension of the default
 * OOUI MessageWidget. It includes support for a title, a message, and button
 * actions.
 *
 * @param config Configuration to be passed to the element.
 * @return A DeputyMessageWidget object
 */
export default function ( config: DeputyMessageWidgetOptions ) {
	if ( !InternalDeputyMessageWidget ) {
		initDeputyMessageWidget();
	}
	return new InternalDeputyMessageWidget( config );
}
