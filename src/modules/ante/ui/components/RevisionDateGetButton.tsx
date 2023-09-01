import MwApi from '../../../../MwApi';

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

			this.revisionInputWidget.on( 'change', this.updateDateAutoButton.bind( this ) );
			this.dateInputWidget.on( 'change', this.updateDateAutoButton.bind( this ) );
			this.on( 'click', this.setDateFromRevision.bind( this ) );
			this.updateDateAutoButton();
		}

		/**
		 * Update the disabled state of the button.
		 */
		updateDateAutoButton(): void {
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
			this
				.setIcon( 'ellipsis' )
				.setDisabled( true );
			this.dateInputWidget.setDisabled( true );
			await MwApi.action.get( {
				action: 'query',
				prop: 'revisions',
				revids: this.revisionInputWidget.getValue(),
				rvprop: 'timestamp'
			} ).then( ( data ) => {
				this.dateInputWidget.setValue(
					// ISO-format date
					data.query.pages[ 0 ].revisions[ 0 ].timestamp.split( 'T' )[ 0 ]
				);
				this.dateInputWidget.setDisabled( false );
				this.setIcon( 'download' );
				this.updateDateAutoButton();
			}, ( error, errorData ) => {
				mw.notify(
					mw.msg( 'deputy.ante.dateAuto.failed', errorData.info ),
					{
						type: 'error'
					}
				);
				this.updateDateAutoButton();
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
