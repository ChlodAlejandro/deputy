import '../../../types';
import CopiedTemplatesEmptyPage from './pages/AttributionNoticesEmptyPage';
import CTEParsoidDocument from '../models/CTEParsoidDocument';
import errorToOO from '../../../wiki/util/errorToOO';
import { blockExit, unblockExit } from '../../../util/blockExit';
import unwrapWidget from '../../../util/unwrapWidget';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';
import { OOUIBookletLayout } from '../../../types';
import type CopiedTemplateEditor from '../CopiedTemplateEditor';
import getObjectValues from '../../../util/getObjectValues';
import { h } from 'tsx-dom';
import AttributionNotice from '../models/AttributionNotice';
import { AttributionNoticePageLayout } from './pages/AttributionNoticePageLayout';
import TemplateMerger from '../models/TemplateMerger';
import TemplateInsertEvent from '../events/TemplateInsertEvent';
import AttributionNoticeAddMenu from './AttributionNoticeAddMenu';
import last from '../../../util/last';
import DeputyReviewDialog from '../../../ui/root/DeputyReviewDialog';
import normalizeTitle from '../../../wiki/util/normalizeTitle';
import getPageContent from '../../../wiki/util/getPageContent';
import openWindow from '../../../wiki/util/openWindow';

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
			title: mw.message( 'deputy.ante' ).text(),
			size: 'huge',
			actions: [
				{
					flags: [ 'primary', 'progressive' ],
					label: mw.message( 'deputy.ante.save' ).text(),
					title: mw.message( 'deputy.ante.save' ).text(),
					action: 'save'
				},
				{
					flags: [ 'safe', 'close' ],
					icon: 'close',
					label: mw.message( 'deputy.ante.close' ).text(),
					title: mw.message( 'deputy.ante.close' ).text(),
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
		 * A map of OOUI PageLayouts keyed by their notices. These PageLayouts also include
		 * functions specific to AttributionNoticePageLayout, such as functions to get child
		 * pages.
		 */
		readonly pageCache: Map<AttributionNotice, AttributionNoticePageLayout> = new Map();

		// ELEMENTS

		/**
		 * The "merge" OOUI ButtonWidget.
		 */
		mergeButton: any;

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
			return 900;
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
					if ( !this.pageCache.has( event.template ) ) {
						this.pageCache.set( event.template, event.template.generatePage( this ) );
						this.rebuildPages();
					}
				}
			);

			this.renderMenuActions();
			this.$body.append( this.layout.$element );
		}

		/**
		 * Rebuilds the pages of this dialog.
		 */
		rebuildPages(): void {
			const notices = this.parsoid.findNotices();
			const pages: AttributionNoticePageLayout[] = [];

			for ( const notice of notices ) {
				let cachedPage = this.pageCache.get( notice );

				if ( cachedPage == null ) {
					cachedPage = notice.generatePage( this );
					this.pageCache.set( notice, cachedPage );
				}

				pages.push( cachedPage );

				if ( cachedPage.getChildren != null ) {
					pages.push( ...cachedPage.getChildren() );
				}
			}

			const lastFocusedPage = this.layout.getCurrentPage();
			let nextFocusedPageName: string;

			const layoutPages = getObjectValues( this.layout.pages );
			const removed = layoutPages
				.filter( ( item ) => pages.indexOf( item ) === -1 );

			if ( removed.indexOf( lastFocusedPage ) === -1 ) {
				// Focus on an existing (and currently focused) page.
				nextFocusedPageName = this.layout.getCurrentPageName();
			} else if ( lastFocusedPage != null && pages.length > 0 ) {
				const layoutNames = Object.keys( this.layout.pages );

				// Find the next page AFTER the one previously focused on (which is
				// about to get removed).
				for (
					let i = layoutNames.indexOf( lastFocusedPage.getName() );
					i < layoutNames.length;
					i++
				) {
					const layoutName = layoutNames[ i ];
					if ( removed.some( ( p ) => p.getName() !== layoutName ) ) {
						// This element will not get removed later on. Use it.
						nextFocusedPageName = layoutName;
						break;
					}
				}

				if ( nextFocusedPageName == null ) {
					// Fall back to last element in the set (most likely position)
					nextFocusedPageName = ( last( pages ) as any ).getName();
				}
			}

			// Remove all removed pages
			this.layout.removePages( removed );

			// Jank, but no other options while page rearranging isn't a thing.
			this.layout.addPages( pages );

			if ( nextFocusedPageName ) {
				this.layout.setPage( nextFocusedPageName );
			}

			// Delete deleted pages from cache.
			this.pageCache.forEach( ( page, notice ) => {
				if ( removed.indexOf( page ) !== -1 ) {
					this.pageCache.delete( notice );
				}
			} );
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
				label: mw.message( 'deputy.ante.add' ).text(),
				title: mw.message( 'deputy.ante.add' ).text(),
				flags: [ 'progressive' ]
			} );

			this.mergeButton = new OO.ui.ButtonWidget( {
				icon: 'tableMergeCells',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.ante.mergeAll' ).text(),
				title: mw.message( 'deputy.ante.mergeAll' ).text(),
				disabled: true
			} );
			// TODO: Repair mergeButton
			this.mergeButton.on( 'click', () => {
				const notices = this.parsoid.findNoticeType( 'copied' );
				if ( notices.length > 1 ) {
					return OO.ui.confirm(
						mw.message(
							'deputy.ante.mergeAll.confirm',
							`${notices.length}`
						).text()
					).done( ( confirmed: boolean ) => {
						if ( !confirmed ) {
							return;
						}

						TemplateMerger.copied( notices );
					} );
				} else {
					return OO.ui.alert( 'There are no templates to merge.' );
				}
			} );

			const resetButton = new OO.ui.ButtonWidget( {
				icon: 'reload',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.ante.reset' ).text(),
				title: mw.message( 'deputy.ante.reset' ).text()
			} );
			resetButton.on( 'click', () => {
				return OO.ui.confirm(
					mw.message( 'deputy.ante.reset.confirm' ).text()
				).done( ( confirmed: boolean ) => {
					if ( confirmed ) {
						this.loadTalkPage().then( () => {
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
				label: mw.message( 'deputy.ante.delete' ).text(),
				title: mw.message( 'deputy.ante.delete' ).text(),
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				// Original copied notice count.
				const notices = this.parsoid.findNotices();
				return OO.ui.confirm(
					mw.message(
						'deputy.ante.delete.confirm',
						`${notices.length}`
					).text()
				).done( ( confirmed: boolean ) => {
					if ( confirmed ) {
						for ( const notice of notices ) {
							notice.destroy();
						}
					}
				} );
			} );

			const previewButton = new OO.ui.ButtonWidget( {
				icon: 'eye',
				framed: false,
				invisibleLabel: true,
				label: mw.message( 'deputy.ante.preview' ).text(),
				title: mw.message( 'deputy.ante.preview' ).text(),
				flags: [ 'destructive' ]
			} );
			previewButton.on( 'click', async () => {
				previewButton.setDisabled( true );
				openWindow( DeputyReviewDialog( {
					title: normalizeTitle( this.parsoid.getPage() ),
					from: await getPageContent( this.parsoid.getPage() ),
					to: await this.parsoid.toWikitext()
				} ) );
				previewButton.setDisabled( false );
			} );

			this.layout.on( 'remove', () => {
				const notices = this.parsoid.findNotices();
				// TODO: Repair mergeButton
				// this.mergeButton.setDisabled( notices.length < 2 );
				deleteButton.setDisabled( notices.length === 0 );
			} );
			this.parsoid.addEventListener( 'templateInsert', () => {
				const notices = this.parsoid.findNotices();
				// TODO: Repair mergeButton
				// this.mergeButton.setDisabled( notices.length < 2 );
				deleteButton.setDisabled( notices.length === 0 );
			} );

			this.$overlay.append(
				new AttributionNoticeAddMenu(
					this.parsoid, addButton
				).render()
			);

			const actionPanel = <div class="cte-actionPanel">
				{ unwrapWidget( addButton ) }
				{ unwrapWidget( this.mergeButton ) }
				{ unwrapWidget( resetButton ) }
				{ unwrapWidget( deleteButton ) }
				{ unwrapWidget( previewButton ) }
			</div>;

			const targetPanel = unwrapWidget( this.layout ).querySelector(
				'.oo-ui-menuLayout .oo-ui-menuLayout-menu'
			);
			targetPanel.insertAdjacentElement( 'afterbegin', actionPanel );
		}

		/**
		 * Loads the talk page.
		 */
		async loadTalkPage(): Promise<void> {
			const talkPage = new mw.Title( mw.config.get( 'wgPageName' ) )
				.getTalkPage()
				.getPrefixedText();

			// Load the talk page
			await this.parsoid.loadPage( talkPage, { reload: true } )
				.catch( errorToOO as any )
				.then( () => true );

			if ( this.parsoid.getPage() !== talkPage ) {
				// Ask for user confirmation.
				await OO.ui.confirm(
					mw.message(
						'deputy.ante.loadRedirect.message',
						talkPage, this.parsoid.getPage()
					).text(),
					{
						title: mw.message( 'deputy.ante.loadRedirect.title' ).text(),
						actions: [
							{
								action: 'accept',
								label: mw.message(
									'deputy.ante.loadRedirect.source'
								).text()
							},
							{
								action: 'deny',
								label: mw.message(
									'deputy.ante.loadRedirect.target'
								).text()
							}
						]
					}
				).then( ( loadSource: boolean ) => {
					if ( loadSource ) {
						// Load redirect page.
						return this.parsoid.loadPage(
							talkPage, { followRedirects: false, reload: true }
						).catch( errorToOO as any ).then( () => true );
					}
				} );
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

			// Load the talk page
			if ( this.parsoid.getDocument() == null ) {
				process.next( this.loadTalkPage() );
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

			// Recheck state of merge button
			this.mergeButton.setDisabled(
				( this.parsoid.findNoticeType( 'copied' ).length ?? 0 ) < 2
			);

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
						OO.ui.alert( mw.message( 'deputy.ante.invalid' ).text() );
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
							this.parsoid.originalCount > 0 ?
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
		 *
		 * @return An OOUI process.
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
