import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import swapElements from '../../util/swapElements';
import { h } from 'tsx-dom';
import MwApi from '../../MwApi';

export interface DeputyReviewDialogData {
	from: string;
	to: string;
	title: mw.Title;
}

let InternalDeputyReviewDialog: any;

/**
 * Initializes the process dialog.
 */
function initDeputyReviewDialog() {
	InternalDeputyReviewDialog = class DeputyReviewDialog extends OO.ui.ProcessDialog {

		static static = {
			name: 'deputyReviewDialog',
			title: mw.msg( 'deputy.diff' ),
			actions: [
				{
					action: 'close',
					label: mw.msg( 'deputy.close' ),
					flags: 'safe'
				}
			]
		};

		data: any;

		/**
		 *
		 * @param config
		 */
		constructor( config: DeputyReviewDialogData & { size: string } ) {
			config.size = config.size || 'larger';
			super( config );
			this.data = config;
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 500;
		}

		/**
		 *
		 * @param {...any} args
		 */
		initialize( ...args: any[] ): void {
			super.initialize.apply( this, args );

			this.element = <div style={ {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center'
			}}>
				<div style={{ marginBottom: '8px' }}>
					{mw.msg( 'deputy.diff.load' )}
				</div>
				{
					unwrapWidget(
						new OO.ui.ProgressBarWidget( {
							classes: [ 'dp-review-progress' ],
							progress: false
						} )
					)
				}
			</div>;
			this.content = new OO.ui.PanelLayout( { expanded: true, padded: true } );
			unwrapWidget( this.content ).appendChild( this.element );
			this.$body.append( this.content.$element );
		}

		/**
		 * @param data
		 * @return The ready process for this object.
		 */
		getReadyProcess( data: any ) {
			return ( super.getReadyProcess.call( this, data ) as typeof window.OO.ui.Process )
				.next( new Promise<void>( ( res ) => {
					// Load MediaWiki diff styles
					mw.loader.using( 'mediawiki.diff.styles', () => res() );
				} ) )
				.next( async () => {
					// Load diff HTML
					const compareRequest = await MwApi.action.post( {
						action: 'compare',
						fromtitle: this.data.title.getPrefixedText(),
						fromslots: 'main',
						totitle: this.data.title.getPrefixedText(),
						toslots: 'main',
						topst: 1,
						prop: 'diff',
						slots: 'main',
						'fromtext-main': this.data.from,
						'fromcontentformat-main': 'text/x-wiki',
						'fromcontentmodel-main': 'wikitext',
						'totext-main': this.data.to,
						'tocontentformat-main': 'text/x-wiki',
						'tocontentmodel-main': 'wikitext'
					} );

					if ( compareRequest.error ) {
						swapElements( this.element, new OO.ui.MessageWidget( {
							type: 'error',
							label: mw.msg( 'deputy.diff.error' )
						} ) );
					}

					const diffHTML = compareRequest.compare.bodies.main;

					if ( !diffHTML ) {
						this.element = swapElements(
							this.element,
							<div style={ { textAlign: 'center' } }>
								{ mw.msg( 'deputy.diff.no-changes' ) }
							</div>
						);
					} else {
						this.element = swapElements(
							this.element,
							<table class="diff">
								<colgroup>
									<col class="diff-marker"/>
									<col class="diff-content"/>
									<col class="diff-marker"/>
									<col class="diff-content"/>
								</colgroup>
								<tbody dangerouslySetInnerHTML={ diffHTML }/>
							</table>
						);
					}
				}, this );
		}

		/**
		 * @param action
		 * @return The action process
		 */
		getActionProcess( action: string ) {
			if ( action === 'close' ) {
				return new OO.ui.Process( function () {
					this.close( {
						action: action
					} );
				}, this );
			}
			// Fallback to parent handler
			return super.getActionProcess.call( this, action );
		}

	};
}

/**
 * Creates a new DeputyReviewDialog.
 *
 * @param config
 * @return A DeputyReviewDialog
 */
export default function ( config: DeputyReviewDialogData ) {
	if ( !InternalDeputyReviewDialog ) {
		initDeputyReviewDialog();
	}
	return new InternalDeputyReviewDialog( config );
}
