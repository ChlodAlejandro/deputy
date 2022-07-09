import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import swapElements from '../../util/swapElements';
import { h } from 'tsx-dom';

// This is one of those "TypeScript, trust me" moments. This is what happens when
// a library can't handle ES extends. I pray that some day OOUI can be an
// actually-usable library that uses ES classes instead of... this...

type DeputyReviewDialogFunction = ( ( config: any ) => void ) & {
	static: any;
	super: any;
};

export interface DeputyReviewDialogData {
	from: string;
	to: string;
	title: mw.Title;
}

let DeputyReviewDialog: DeputyReviewDialogFunction = null;

/**
 * Creates a new DeputyReviewDialog.
 *
 * @param _data
 * @return A DeputyReviewDialog (extends from OO.ui.ProcessDialog)
 */
export default function ( _data: DeputyReviewDialogData ): any {
	if ( DeputyReviewDialog == null ) {
		/**
		 * @param config
		 * @param config.data
		 * @param config.size
		 */
		DeputyReviewDialog = function ( config: {
			size: string,
			data: DeputyReviewDialogData
		} ) {
			config.size = config.size || 'larger';
			( DeputyReviewDialog as any ).super.call( this, config );
		} as DeputyReviewDialogFunction;

		OO.inheritClass( DeputyReviewDialog, OO.ui.ProcessDialog );

		DeputyReviewDialog.static.name = 'deputyReviewDialog';
		DeputyReviewDialog.static.title = mw.message( 'deputy.diff' ).text();
		DeputyReviewDialog.static.actions = [
			{
				action: 'close',
				label: mw.message( 'deputy.close' ).text(),
				flags: 'safe'
			}
		];
		DeputyReviewDialog.prototype.getBodyHeight = function () {
			return 500;
		};

		// Add content to the dialog body and setup event handlers.
		DeputyReviewDialog.prototype.initialize = function ( ...args: [] ) {
			DeputyReviewDialog.super.prototype.initialize.apply( this, args );

			this.element = <div style={ {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				textAlign: 'center'
			}}>
				<div style={{ marginBottom: '8px' }}>
					{mw.message( 'deputy.diff.load' ).text()}
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
		};

		DeputyReviewDialog.prototype.getReadyProcess = function ( data: any ) {
			return ( DeputyReviewDialog.super.prototype.getReadyProcess
				.call( this, data ) as typeof window.OO.ui.Process )
				.next( new Promise<void>( ( res ) => {
					// Load MediaWiki diff styles
					mw.loader.using( 'mediawiki.diff.styles', () => res() );
				} ) )
				.next( async () => {
					// Load diff HTML
					const compareRequest = await window.deputy.wiki.post( {
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
							label: mw.message( 'deputy.diff.error' ).text()
						} ) );
					}

					const diffHTML = compareRequest.compare.bodies.main;

					if ( !diffHTML ) {
						this.element = swapElements(
							this.element,
							<div style={ { textAlign: 'center' } }>
								{ mw.message( 'deputy.diff.no-changes' ).text() }
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
		};

		// Specify processes to handle the actions.
		DeputyReviewDialog.prototype.getActionProcess = function ( action: string ) {
			if ( action === 'close' ) {
				return new OO.ui.Process( function () {
					this.close( {
						action: action
					} );
				}, this );
			}
			// Fallback to parent handler
			return DeputyReviewDialog.super.prototype.getActionProcess.call( this, action );
		};
	}
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return new DeputyReviewDialog( { data: _data } );
}
