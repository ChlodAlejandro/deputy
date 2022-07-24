import '../../../types';
import CopiedTemplatesEmptyPage from './pages/CopiedTemplatesEmptyPage';
import CTEParsoidDocument, { TemplateInsertEvent } from '../models/CTEParsoidDocument';
import CopiedTemplatePage from './pages/CopiedTemplatePage';
import CopiedTemplateRowPage from './pages/CopiedTemplateRowPage';
import errorToOO from '../../../util/errorToOO';
import { blockExit, unblockExit } from '../../../util/blockExit';
import unwrapWidget from '../../../util/unwrapWidget';
import decorateEditSummary from '../../../util/decorateEditSummary';
import CopiedTemplate from '../models/CopiedTemplate';
import { OOUIBookletLayout } from '../../../types';
import type CopiedTemplateEditor from '../CopiedTemplateEditor';
import getObjectValues from '../../../util/getObjectValues';
import last from '../../../util/last';
import { h } from 'tsx-dom';

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
					// If no pages left, append the "no notices" page.

					this.layout.addPages( [ CopiedTemplatesEmptyPage( {
						parent: this,
						parsoid: this.parsoid
					} ) ], 0 );
				}
			} );

			this.parsoid.addEventListener(
				'templateInsert',
				( event: TemplateInsertEvent ) => {
					const toPush = [];
					toPush.push( CopiedTemplatePage( {
						copiedTemplate: event.template,
						parent: this
					} ) );
					for ( const row of event.template.rows ) {
						toPush.push( CopiedTemplateRowPage( {
							copiedTemplateRow: row,
							parent: this
						} ) );
					}

					// Find where to insert the template.
					// This will look for the last row page of the template prior (or the
					// template row if a row page does not exist) and insert after that.
					const lastTemplateIndex =
						Math.max( 0, this.parsoid.copiedNotices.indexOf( event.template ) - 1 );
					const lastTemplate = this.parsoid.copiedNotices[ lastTemplateIndex ];
					const pagesArray: any[] = getObjectValues( this.layout.pages );
					const beforePage = last( pagesArray.filter(
						( page ) => page.copiedTemplateRow != null &&
							page.copiedTemplateRow.parent != null &&
							page.copiedTemplateRow.parent === lastTemplate
					) );
					const beforePageIndex = pagesArray.indexOf( beforePage );
					this.layout.addPages( toPush, beforePageIndex + 1 );
				}
			);

			this.renderMenuActions();
			this.$body.append( this.layout.$element );
		}

		/**
		 * Renders the collection of actions at the top of the page menu. Also
		 * appends the panel to the layout.
		 */
		renderMenuActions() {
			const addButton = new OO.ui.ButtonWidget( {
				icon: 'add',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.cte.add' ).text(),
				title: mw.message( 'deputy.cte.add' ).text(),
				flags: [ 'progressive' ]
			} );
			addButton.on( 'click', () => {
				// TODO: Add support for adding different template types.
				this.addTemplate();
			} );

			const mergeButton = new OO.ui.ButtonWidget( {
				icon: 'tableMergeCells',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.cte.merge' ).text(),
				title: mw.message( 'deputy.cte.merge' ).text(),
				disabled: ( this.parsoid.copiedNotices?.length ?? 0 ) < 2
			} );
			mergeButton.on( 'click', () => {
				const notices = this.parsoid.copiedNotices.length;
				if ( notices > 1 ) {
					return OO.ui.confirm(
						mw.message( 'deputy.cte.merge.confirm', `${notices}` ).text()
					).done( ( confirmed: boolean ) => {
						if ( !confirmed ) {
							return;
						}

						CopiedTemplate.mergeTemplates( this.parsoid.copiedNotices );
					} );
				} else {
					return OO.ui.alert( 'There are no templates to merge.' );
				}
			} );

			const resetButton = new OO.ui.ButtonWidget( {
				icon: 'reload',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.cte.reset' ).text(),
				title: mw.message( 'deputy.cte.reset' ).text()
			} );
			resetButton.on( 'click', () => {
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
			} );

			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.cte.delete' ).text(),
				title: mw.message( 'deputy.cte.delete' ).text(),
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
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
			} );

			this.layout.on( 'remove', () => {
				if ( this.parsoid.copiedNotices ) {
					mergeButton.setDisabled( this.parsoid.copiedNotices.length < 2 );
					deleteButton.setDisabled( this.parsoid.copiedNotices.length === 0 );
				}
			} );
			this.parsoid.addEventListener( 'templateInsert', () => {
				if ( this.parsoid.copiedNotices ) {
					mergeButton.setDisabled( this.parsoid.copiedNotices.length < 2 );
					deleteButton.setDisabled( this.parsoid.copiedNotices.length === 0 );
				}
			} );

			const actionPanel = <div class="cte-actionPanel">
				{ unwrapWidget( addButton ) }
				{ unwrapWidget( mergeButton ) }
				{ unwrapWidget( resetButton ) }
				{ unwrapWidget( deleteButton ) }
			</div>;

			const targetPanel = unwrapWidget( this.layout ).querySelector(
				'.oo-ui-menuLayout .oo-ui-menuLayout-menu'
			);
			targetPanel.insertAdjacentElement( 'afterbegin', actionPanel );
		}

		/**
		 * Rebuilds the pages of this dialog.
		 */
		rebuildPages(): void {
			const pages = [];
			for ( const template of ( this.parsoid.copiedNotices ?? [] ) ) {
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

			if ( this.parsoid.getDocument() == null ) {
				// Load the talk page
				process.next( this.parsoid.loadPage(
					new mw.Title( mw.config.get( 'wgPageName' ) )
						.getTalkPage()
						.getPrefixedText()
				).catch( errorToOO as any ).then( () => true ) );
			}

			// Rebuild the list of pages
			process.next( () => {
				this.rebuildPages();
				return true;
			} );

			// Block exits
			process.next( () => {
				blockExit( 'cte' );
				return true;
			} );

			return process;
		}

		/**
		 * Gets this dialog's ready process. Called after the dialog has opened.
		 *
		 * @return An OOUI Process
		 */
		getReadyProcess() {
			const process = super.getReadyProcess();

			process.next( () => {
				for ( const page of getObjectValues( this.layout.pages ) ) {
					// Dirty check to see if this is a CopiedTemplatePage.
					if ( ( page as any ).updatePreview != null ) {
						page.updatePreview();
					}
				}
			}, this );

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
			if ( action === 'save' ) {
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
						// TODO: l10n
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
			}

			process.next( () => {
				this.close( { action: action } );
			}, this );

			return process;
		}

		/**
		 * Gets the teardown process. Called when the dialog is closing.
		 */
		getTeardownProcess() {
			const process = super.getTeardownProcess();
			process.next( () => {
				// Already unblocked if "save", but this cuts down on code footprint.
				unblockExit( 'cte' );

				this.main.toggleButtons( true );
			} );
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
