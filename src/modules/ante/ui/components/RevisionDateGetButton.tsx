import MwApi from '../../../../MwApi';
import getApiErrorText from '../../../../wiki/util/getApiErrorText';

export interface RevisionDateGetButtonData extends OO.ui.ButtonWidget.ConfigOptions {
	revisionInputWidget: OO.ui.InputWidget;
	dateInputWidget: OO.ui.InputWidget;
}

let InternalRevisionDateGetButton: any;

/**
 * Initializes the process element.
 */
function initRevisionDateGetButton() {
	InternalRevisionDateGetButton = class RevisionDateGetButton extends OO.ui.ButtonWidget {

		revisionInputWidget: OO.ui.InputWidget;
		dateInputWidget: OO.ui.InputWidget;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: RevisionDateGetButtonData ) {
			super( Object.assign( {
				icon: 'download',
				invisibleLabel: true,
				disabled: true
			}, config ) );

			this.revisionInputWidget = config.revisionInputWidget;
			this.dateInputWidget = config.dateInputWidget;

			this.revisionInputWidget.on( 'change', this.updateButton.bind( this ) );
			this.dateInputWidget.on( 'change', this.updateButton.bind( this ) );
			this.on( 'click', this.setDateFromRevision.bind( this ) );
			this.updateButton();
		}

		/**
		 * Update the disabled state of the button.
		 */
		updateButton(): void {
			this.setDisabled(
				isNaN( +this.revisionInputWidget.getValue() ) ||
				!!this.dateInputWidget.getValue()
			);
		}

		/**
		 * Set the date from the revision ID provided in the value of
		 * `this.revisionInputWidget`.
		 */
		async setDateFromRevision(): Promise<void> {
			const revid = this.revisionInputWidget.getValue();

			if ( isNaN( +revid ) ) {
				mw.notify(
					mw.msg( 'deputy.ante.dateAuto.invalid' ),
					{ type: 'error' }
				);
				this.updateButton();
				return;
			}

			this
				.setIcon( 'ellipsis' )
				.setDisabled( true );
			this.dateInputWidget.setDisabled( true );

			await MwApi.action.get( {
				action: 'query',
				prop: 'revisions',
				revids: revid,
				rvprop: 'timestamp'
			} ).then( ( data ) => {
				if ( ( data.query as any ).badrevids != null ) {
					mw.notify(
						mw.msg( 'deputy.ante.dateAuto.missing', revid ),
						{ type: 'error' }
					);
					this.updateButton();
					return;
				}

				this.dateInputWidget.setValue(
					// ISO-format date
					data.query.pages[ 0 ].revisions[ 0 ].timestamp.split( 'T' )[ 0 ]
				);
				this.dateInputWidget.setDisabled( false );
				this.setIcon( 'download' );
				this.updateButton();
			}, ( _error, errorData ) => {
				mw.notify(
					mw.msg( 'deputy.ante.dateAuto.failed', getApiErrorText( errorData ) ),
					{ type: 'error' }
				);
				this.dateInputWidget.setDisabled( false );
				this.setIcon( 'download' );
				this.updateButton();
			} );
		}

	};
}

/**
 * Creates a new RevisionDateGetButton.
 *
 * @param config Configuration to be passed to the element.
 * @return A RevisionDateGetButton object
 */
export default function ( config: RevisionDateGetButtonData ) {
	if ( !InternalRevisionDateGetButton ) {
		initRevisionDateGetButton();
	}
	return new InternalRevisionDateGetButton( config );
}
