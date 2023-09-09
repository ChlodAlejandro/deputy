import MwApi from '../../../../MwApi';
import getApiErrorText from '../../../../wiki/util/getApiErrorText';

export interface PageLatestRevisionGetButtonData extends OO.ui.ButtonWidget.ConfigOptions {
	titleInputWidget: OO.ui.TextInputWidget;
	revisionInputWidget: OO.ui.InputWidget;
}

let InternalPageLatestRevisionGetButton: any;

/**
 * Initializes the process element.
 */
function initPageLatestRevisionGetButton() {
	InternalPageLatestRevisionGetButton = class PageLatestRevisionGetButton
		extends OO.ui.ButtonWidget {

		titleInputWidget: OO.ui.TextInputWidget;
		revisionInputWidget: OO.ui.InputWidget;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: PageLatestRevisionGetButtonData ) {
			super( Object.assign( {
				icon: 'download',
				invisibleLabel: true,
				disabled: true
			}, config ) );

			this.titleInputWidget = config.titleInputWidget;
			this.revisionInputWidget = config.revisionInputWidget;

			this.titleInputWidget.on( 'change', this.updateButton.bind( this ) );
			this.revisionInputWidget.on( 'change', this.updateButton.bind( this ) );
			this.on( 'click', this.setRevisionFromPageLatestRevision.bind( this ) );
			this.updateButton();
		}

		/**
		 * Update the disabled state of the button.
		 */
		updateButton(): void {
			this.setDisabled(
				this.titleInputWidget.getValue().trim().length === 0 ||
				this.revisionInputWidget.getValue().trim().length !== 0 ||
				!( this.titleInputWidget as any ).isQueryValid()
			);
		}

		/**
		 * Set the revision ID from the page provided in the value of
		 * `this.titleInputWidget`.
		 */
		async setRevisionFromPageLatestRevision(): Promise<void> {
			this
				.setIcon( 'ellipsis' )
				.setDisabled( true );
			this.revisionInputWidget.setDisabled( true );
			const title = this.titleInputWidget.getValue();
			await MwApi.action.get( {
				action: 'query',
				prop: 'revisions',
				titles: title,
				rvprop: 'ids'
			} ).then( ( data ) => {
				if ( ( data.query as any ).pages[ 0 ].missing ) {
					mw.notify(
						mw.msg( 'deputy.ante.revisionAuto.missing', title ),
						{ type: 'error' }
					);
					this.updateButton();
					return;
				}

				this.revisionInputWidget.setValue( data.query.pages[ 0 ].revisions[ 0 ].revid );
				this.revisionInputWidget.setDisabled( false );
				this.setIcon( 'download' );
				this.updateButton();
			}, ( _error, errorData ) => {
				mw.notify(

					mw.msg( 'deputy.ante.revisionAuto.failed', getApiErrorText( errorData ) ),
					{ type: 'error' }
				);
				this.revisionInputWidget.setDisabled( false );
				this.setIcon( 'download' );
				this.updateButton();
			} );
		}

	};
}

/**
 * Creates a new PageLatestRevisionGetButton.
 *
 * @param config Configuration to be passed to the element.
 * @return A PageLatestRevisionGetButton object
 */
export default function ( config: PageLatestRevisionGetButtonData ) {
	if ( !InternalPageLatestRevisionGetButton ) {
		initPageLatestRevisionGetButton();
	}
	return new InternalPageLatestRevisionGetButton( config );
}
