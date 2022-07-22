import '../../../types';
import CopiedTemplatesEmptyPage from './CopiedTemplatesEmptyPage';
import CTEParsoidDocument from '../models/CTEParsoidDocument';
import CopiedTemplatePage from './CopiedTemplatePage';
import CopiedTemplateRowPage from './CopiedTemplateRowPage';
import errorToOO from '../../../util/errorToOO';
import { blockExit, unblockExit } from '../../../util/blockExit';
import unwrapWidget from '../../../util/unwrapWidget';
import decorateEditSummary from '../../../util/decorateEditSummary';
import CopiedTemplate from '../models/CopiedTemplate';
import { OOUIBookletLayout } from '../../../types';
import type CopiedTemplateEditor from '../CopiedTemplateEditor';

interface CopiedTemplateEditorDialogData {
	main: CopiedTemplateEditor;
	/**
	 * Extra classes for this dialog.
	 */
	classes?: string[];
}

let InternalCopiedTemplateEditorDialog: any;

/**
 * Initializes the process element.
 */
function initCopiedTemplateEditorDialog() {
	InternalCopiedTemplateEditorDialog = class CopiedTemplateEditorDialog
		extends OO.ui.ProcessDialog {

		static static = {
			name: 'copiedTemplateEditorDialog',
			title: mw.message( 'deputy.cte' ).text(),
			size: 'larger',
			actions: [
				{
					flags: [ 'primary', 'progressive' ],
					label: mw.message( 'deputy.save' ).text(),
					title: mw.message( 'deputy.save' ).text(),
					action: 'save'
				},
				{
					flags: [ 'safe', 'close' ],
					icon: 'close',
					label: mw.message( 'deputy.close' ).text(),
					title: mw.message( 'deputy.close' ).text(),
					invisibleLabel: true,
					action: 'close'
				},
				{
					action: 'add',
					icon: 'add',
					label: mw.message( 'deputy.cte.add' ).text(),
					title: mw.message( 'deputy.cte.add' ).text(),
					invisibleLabel: true
				},
				{
					action: 'merge',
					icon: 'tableMergeCells',
					label: mw.message( 'deputy.cte.merge' ).text(),
					title: mw.message( 'deputy.cte.merge' ).text(),
					invisibleLabel: true
				},
				{
					action: 'reset',
					icon: 'reload',
					label: mw.message( 'deputy.cte.reset' ).text(),
					title: mw.message( 'deputy.cte.reset' ).text(),
					invisibleLabel: true,
					flags: [ 'destructive' ]
				},
				{
					action: 'delete',
					icon: 'trash',
					label: mw.message( 'deputy.cte.delete' ).text(),
					title: mw.message( 'deputy.cte.delete' ).text(),
					invisibleLabel: true,
					flags: [ 'destructive' ]
				}
			]
		};

		/**
		 * The BookletLayout for this dialog.
		 */
		layout: OOUIBookletLayout;
		/**
		 * Parsoid document for this dialog.
		 */
		readonly parsoid: CTEParsoidDocument = new CTEParsoidDocument();
		/**
		 * The main CTE instance handling this page.
		 */
		readonly main: CopiedTemplateEditor;

		/**
		 * @param config
		 */
		constructor( config: CopiedTemplateEditorDialogData ) {
			super( config );
			this.main = config.main;
		}

		/**
		 * @return The body height of this dialog.
		 */
		getBodyHeight(): number {
			return 500;
		}

		/**
		 * Initializes the dialog.
		 */
		initialize() {
			super.initialize();

			this.layout = new OO.ui.BookletLayout( {
				continuous: true,
				outlined: true
			} );

			this.layout.on( 'remove', () => {
				if ( Object.keys( this.layout.pages ).length === 0 ) {
					this.layout.addPages( [ CopiedTemplatesEmptyPage( {
						parent: this,
						parsoid: this.parsoid
					} ) ], 0 );
				}
			} );

			this.parsoid.addEventListener( 'insert', () => {
				this.rebuildPages();
			} );

			this.$body.append( this.layout.$element );
		}

		/**
		 * Rebuilds the pages of this dialog.
		 */
		rebuildPages(): void {
			const pages = [];
			for ( const template of this.parsoid.copiedNotices ) {
				console.log( template );
				if ( template.rows === undefined ) {
					// Likely deleted. Skip.
					continue;
				}
				pages.push( CopiedTemplatePage( {
					copiedTemplate: template,
					parent: this
				} ) );
				for ( const row of template.rows ) {
					pages.push( CopiedTemplateRowPage( {
						copiedTemplateRow: row,
						parent: this
					} ) );
				}
			}
			this.layout.clearPages();
			this.layout.addPages( pages );
		}

		/**
		 * Adds a new template to this dialog.
		 * TODO: Support more than just a {{copied}} template.
		 */
		addTemplate() {
			const spot = this.parsoid.findCopiedNoticeSpot();

			if ( spot === null ) {
				// Not able to find a spot. Should theoretically be impossible since
				// there is a catch-all "beforebegin" section 0 spot. But just in case.
				OO.ui.notify(
					mw.message( 'deputy.cte.noSpot' ).text()
				);
			} else {
				this.parsoid.insertNewNotice( spot );
			}
		}

		/**
		 * Gets the setup process for this dialog. This is run prior to the dialog
		 * opening.
		 *
		 * @param data Additional data. Unused for this dialog.
		 * @return An OOUI Process
		 */
		getSetupProcess( data: any ) {
			const process = super.getSetupProcess( data );

			if ( this.parsoid.getDocument() != null ) {
				// Reset the frame.
				process.first( () => {
					return OO.ui.alert(
						mw.message( 'deputy.cte.dirty' ).text()
					).done( () => {
						this.parsoid.reset();
					} );
				} );
			}

			// Load the talk page
			process.next( () => {
				return this.parsoid.loadPage(
					new mw.Title( mw.config.get( 'wgPageName' ) )
						.getTalkPage()
						.getPrefixedText()
				).catch( errorToOO as any );
			} );

			// Rebuild the list of pages
			process.next( () => {
				return this.rebuildPages();
			} );

			// Block exits
			process.next( () => {
				blockExit( 'cte' );
			} );

			return process;
		}

		/**
		 * Gets this dialog's action process. Handles all actions (primarily dialog
		 * button clicks, etc.)
		 *
		 * @param action
		 * @return An OOUI Process
		 */
		getActionProcess( action: string ) {
			const process = super.getActionProcess( action );
			switch ( action ) {
				case 'save':
					// Quick and dirty validity check.
					if (
						unwrapWidget( this.layout )
							.querySelector( '.oo-ui-flaggedElement-invalid' ) != null
					) {
						return new OO.ui.Process( () => {
							OO.ui.alert( mw.message( 'deputy.cte.invalid' ).text() );
						} );
					}

					// Saves the page.
					process.next( async () => {
						return new mw.Api().postWithEditToken( {
							action: 'edit',
							format: 'json',
							formatversion: '2',
							utf8: 'true',
							title: this.parsoid.getPage(),
							text: await this.parsoid.toWikitext(),
							summary: decorateEditSummary( `${
								this.parsoid.originalNoticeCount > 0 ?
									'Modifying' : 'Adding'
							} content attribution notices` )
						} ).catch( errorToOO );
					}, this );

					// Page redirect
					process.next( () => {
						unblockExit( 'cte' );
						if (
							mw.config.get( 'wgPageName' ) === this.parsoid.getPage()
						) {
							// If on the talk page, reload the page.
							window.location.reload();
						} else {
							// If on another page, open the talk page.
							window.location.href =
								mw.config.get( 'wgArticlePath' ).replace(
									/\$1/g,
									encodeURIComponent( this.parsoid.getPage() )
								);
						}
					}, this );
					break;
				case 'reset':
					process.next( () => {
						return OO.ui.confirm(
							mw.message( 'deputy.cte.reset.confirm' ).text()
						).done( ( confirmed: boolean ) => {
							if ( confirmed ) {
								this.parsoid.reload().then( () => {
									this.layout.clearPages();
									this.rebuildPages();
								} );
							}
						} );
					}, this );
					break;
				case 'merge':
					process.next( () => {
						const notices = this.parsoid.copiedNotices.length;
						if ( notices > 1 ) {
							return OO.ui.confirm(
								mw.message( 'deputy.cte.merge.confirm', `${notices}` ).text()
							).done( ( confirmed: boolean ) => {
								if ( !confirmed ) {
									return;
								}

								const pivot = this.parsoid.copiedNotices[ 0 ];
								while ( this.parsoid.copiedNotices.length > 1 ) {
									let template = this.parsoid.copiedNotices[ 0 ];
									if ( template === pivot ) {
										template = this.parsoid.copiedNotices[ 1 ];
									}
									pivot.merge( template, { delete: true } );
								}
							} );
						} else {
							return OO.ui.alert( 'There are no templates to merge.' );
						}
					}, this );
					break;
				case 'delete':
					process.next( () => {
						// Original copied notice count.
						const notices = this.parsoid.copiedNotices.length;
						const rows = this.parsoid.copiedNotices
							.reduce( ( p: number, n: CopiedTemplate ) => p + n.rows.length, 0 );
						return OO.ui.confirm(
							mw.message(
								'deputy.cte.delete.confirm',
								`${notices}`,
								`${rows}`
							).text()
						).done( ( confirmed: boolean ) => {
							if ( confirmed ) {
								while ( this.parsoid.copiedNotices.length > 0 ) {
									this.parsoid.copiedNotices[ 0 ].destroy();
								}
							}
						} );
					}, this );
					break;
				case 'add':
					process.next( () => {
						this.addTemplate();
					}, this );
					break;
			}

			if ( action === 'save' || action === 'close' ) {
				process.next( () => {
					this.close( { action: action } );
					// Already unblocked if "save", but this cuts down on code footprint.
					unblockExit( 'cte' );
					this.parsoid.reset();
					this.parsoid.destroy();

					// TODO: Reimplement main CTE class.
					// window.CopiedTemplateEditor.toggleButtons( true );
				}, this );
			}

			return process;
		}

	};
}

/**
 * Creates a new CopiedTemplateEditorDialog.
 *
 * @param config
 * @return A CopiedTemplateEditorDialog object
 */
export default function ( config: CopiedTemplateEditorDialogData ) {
	if ( !InternalCopiedTemplateEditorDialog ) {
		initCopiedTemplateEditorDialog();
	}
	return new InternalCopiedTemplateEditorDialog( config );
}
