import { h } from 'tsx-dom';
import '../../../../types';
import CopiedTemplate from '../../models/CopiedTemplate';
import CopiedTemplateRowPage from './CopiedTemplateRowPage';
import unwrapWidget from '../../../../util/unwrapWidget';
import CopiedTemplateRow from '../../models/CopiedTemplateRow';
import CTEParsoidDocument from '../../models/CTEParsoidDocument';
import RowChangeEvent from '../../models/RowChangeEvent';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { OOUIBookletLayout } from '../../../../types';
import removeElement from '../../../../util/removeElement';

export interface CopiedTemplatePageData {
	/**
	 * The template that this page refers to.
	 */
	copiedTemplate: CopiedTemplate;
	/**
	 * The parent of this page.
	 *
	 * Set to `any` due to OOUI's lack of proper TypeScript support.
	 */
	parent: /* CopiedTemplateEditorDialog */ any;
}

let InternalCopiedTemplatePage: any;

/**
 * UI representation of a {{copied}} template. This representation is further broken
 * down with `CopiedTemplateRowPage`, which represents each row on the template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initCopiedTemplatePage() {
	InternalCopiedTemplatePage = class CopiedTemplatePage extends OO.ui.PageLayout {

		/**
		 * The ParsoidDocument that this {{copied}} template is from.
		 */
		document: CTEParsoidDocument;
		/**
		 * The template that this page refers to.
		 */
		copiedTemplate: CopiedTemplate;
		/**
		 * The parent of this page.
		 */
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		// ELEMENTS
		/**
		 * The "merge" toggle button in the button set.
		 */
		mergeButton: any;
		/**
		 * A record of OOUI InputWidget objects.
		 */
		inputSet: Record<string, any>;
		/**
		 * Fields of input widgets in `inputSet`.
		 */
		fields: Record<string, any>;
		/**
		 * The label of this page. Used in the BookletLayout and header.
		 */
		label: string;
		/**
		 * The preview panel. A <div> that encloses MediaWiki parser output: the rendered
		 * preview of the template.
		 */
		previewPanel: HTMLElement;

		/**
		 * A throttled function that updates the preview panel.
		 */
		updatePreview: () => Promise<void> =
			( mw.util as any ).throttle( this.updatePreviewPanel.bind( this ), 1000 );

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CopiedTemplatePageData ) {
			const { copiedTemplate, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( copiedTemplate == null ) {
				throw new Error( 'Reference template (CopiedTemplate) is required' );
			}

			const label = mw.message(
				'deputy.cte.copied.label',
				config.copiedTemplate.name
			).text();
			const finalConfig = {
				label: label,
				classes: [ 'cte-page-template' ]
			};
			super(
				`${copiedTemplate.element.getAttribute( 'about' )}-${copiedTemplate.i}`,
				finalConfig
			);

			this.document = config.copiedTemplate.parsoid;
			this.copiedTemplate = config.copiedTemplate;
			this.parent = config.parent;
			this.label = label;

			// Adds listener to handle added rows to the template.
			copiedTemplate.addEventListener( 'rowAdd', ( event: RowChangeEvent ) => {
				// Find the last row's page in the layout.
				const lastPage =
					// Get the last row's page (or this page if we don't have a thing)
					( parent.layout as OOUIBookletLayout ).getPage(
						copiedTemplate.rows.length === 1 ?
							this.name :
							copiedTemplate.rows[ copiedTemplate.rows.length - 2 ].id
					);
				const lastPageIndex =
					parent.layout.stackLayout.getItems().indexOf( lastPage );
				parent.layout.addPages( [
					CopiedTemplateRowPage( {
						copiedTemplateRow: event.row,
						parent
					} )
				], lastPageIndex + 1 );
			} );

			// Removes a child row from the BookletLayout parent once it has been destroyed.
			copiedTemplate.addEventListener( 'destroy', () => {
				// Check if we haven't been deleted yet.
				if ( parent.layout.getPage( this.name ) ) {
					parent.layout.removePages( [ this ] );
				}
			} );

			this.$element.append(
				this.renderButtons(),
				this.renderHeader(),
				this.renderMergePanel(),
				this.renderPreviewPanel(),
				this.renderTemplateOptions()
			);
		}

		/**
		 * @return The rendered header of this PageLayout.
		 */
		renderHeader(): JSX.Element {
			return <h3>{ this.label }</h3>;
		}

		/**
		 * Renders the set of buttons that appear at the top of the page.
		 *
		 * @return A <div> element.
		 */
		renderButtons(): JSX.Element {
			const buttonSet = <div style={{ float: 'right' }}/>;

			this.mergeButton = new OO.ui.ButtonWidget( {
				icon: 'tableMergeCells',
				title: mw.message( 'deputy.cte.copied.merge' ).text(),
				framed: false
			} );
			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.message( 'deputy.cte.copied.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				if ( this.copiedTemplate.rows.length > 0 ) {
					OO.ui.confirm(
						mw.message(
							'deputy.cte.copied.remove.confirm',
							`${this.copiedTemplate.rows.length}`
						).text()
					).done( ( confirmed: boolean ) => {
						if ( confirmed ) {
							this.copiedTemplate.destroy();
						}
					} );
				} else {
					this.copiedTemplate.destroy();
				}
			} );
			const addButton = new OO.ui.ButtonWidget( {
				label: mw.message( 'deputy.cte.copied.add' ).text()
			} );
			addButton.on( 'click', () => {
				this.copiedTemplate.addRow( new CopiedTemplateRow( {
					to: new mw.Title(
						this.document.getPage()
					).getSubjectPage().getPrefixedText()
				}, this.copiedTemplate ) );
			} );

			buttonSet.appendChild( unwrapWidget( this.mergeButton ) );
			buttonSet.appendChild( unwrapWidget( deleteButton ) );
			buttonSet.appendChild( unwrapWidget( addButton ) );

			return buttonSet;
		}

		/**
		 * Renders the panel used to merge multiple {{copied}} templates.
		 *
		 * @return A <div> element
		 */
		renderMergePanel(): JSX.Element {
			const mergePanel = new OO.ui.FieldsetLayout( {
				classes: [ 'cte-merge-panel' ],
				icon: 'tableMergeCells',
				label: mw.message( 'deputy.cte.copied.merge.title' ).text()
			} );
			unwrapWidget( mergePanel ).style.padding = '16px';
			unwrapWidget( mergePanel ).style.zIndex = '20';
			// Hide by default
			mergePanel.toggle( false );

			// <select> and button for merging templates
			const mergeTarget = new OO.ui.DropdownInputWidget( {
				$overlay: true,
				label: mw.message( 'deputy.cte.copied.merge.from.select' ).text()
			} );
			const mergeTargetButton = new OO.ui.ButtonWidget( {
				label: mw.message( 'deputy.cte.copied.merge.button' ).text()
			} );
			mergeTargetButton.on( 'click', () => {
				const template = this.document.copiedNotices.find(
					( v ) => v.name === mergeTarget.value
				);
				if ( template ) {
					// If template found, merge and reset panel
					this.copiedTemplate.merge( template, { delete: true } );
					mergeTarget.setValue( null );
					mergePanel.toggle( false );
				}
			} );

			const mergeFieldLayout = new OO.ui.ActionFieldLayout(
				mergeTarget,
				mergeTargetButton,
				{
					label: mw.message( 'deputy.cte.copied.merge.from.label' ).text(),
					align: 'left'
				}
			);
			this.mergeButton.on( 'click', () => {
				mergePanel.toggle();
			} );
			const mergeAllButton = new OO.ui.ButtonWidget( {
				label: mw.message( 'deputy.cte.copied.merge.all' ).text(),
				flags: [ 'progressive' ]
			} );
			mergeAllButton.on( 'click', () => {
				// Confirm before merging.
				OO.ui.confirm(
					mw.message(
						'deputy.cte.copied.merge.all.confirm',
						`${this.document.copiedNotices.length - 1}`
					).text()
				).done( ( confirmed: boolean ) => {
					if ( confirmed ) {
						// Recursively merge all templates
						CopiedTemplate.mergeTemplates(
							this.document.copiedNotices,
							this.copiedTemplate
						);
						mergeTarget.setValue( null );
						mergePanel.toggle( false );
					}
				} );
			} );

			const recalculateOptions = () => {
				const options = [];
				for ( const notice of this.document.copiedNotices ) {
					if ( notice === this.copiedTemplate ) {
						continue;
					}
					options.push( {
						data: notice.name,
						label: `Copied ${notice.name}`
					} );
				}
				if ( options.length === 0 ) {
					options.push( {
						data: null,
						label: mw.message( 'deputy.cte.copied.merge.from.empty' ).text(),
						disabled: true
					} );
					mergeTargetButton.setDisabled( true );
					mergeAllButton.setDisabled( true );
				} else {
					mergeTargetButton.setDisabled( false );
					mergeAllButton.setDisabled( false );
				}
				mergeTarget.setOptions( options );
			};
			mergePanel.on( 'toggle', recalculateOptions );

			mergePanel.addItems( [ mergeFieldLayout, mergeAllButton ] );
			return unwrapWidget( mergePanel );
		}

		/**
		 * Updates the preview panel rendered with `renderPreviewPanel()`.
		 */
		private async updatePreviewPanel(): Promise<void> {
			if ( !this.previewPanel ) {
				// Skip if still unavailable.
				return;
			}

			await this.copiedTemplate.generatePreview().then( ( data ) => {
				this.previewPanel.innerHTML = data;

				// Remove DiscussionTools empty talk page notice
				const emptyStateNotice = this.previewPanel.querySelector<HTMLElement>(
					'.ext-discussiontools-emptystate'
				);
				if ( emptyStateNotice ) {
					removeElement( emptyStateNotice );
				}

				// Make all anchor links open in a new tab (prevents exit navigation)
				this.previewPanel.querySelectorAll( 'a' )
					.forEach( ( el: HTMLElement ) => {
						el.setAttribute( 'target', '_blank' );
						el.setAttribute( 'rel', 'noopener' );
					} );

				// Infuse collapsibles
				( $( this.previewPanel ).find( '.collapsible' ) as any )
					.makeCollapsible();
			} );
		}

		/**
		 * Renders the preview "panel". Not an actual panel, but rather a <div> that
		 * shows a preview of the template to be saved.
		 *
		 * @return A <div> element, containing an HTML render of the template wikitext.
		 */
		renderPreviewPanel(): JSX.Element {
			this.previewPanel = <div class="cte-preview" /> as HTMLElement;

			// Listen for changes
			this.copiedTemplate.addEventListener( 'save', () => {
				this.updatePreview();
			} );
			this.updatePreview();

			return this.previewPanel;
		}

		/**
		 * Renders the global options of this template. This includes parameters that are not
		 * counted towards an entry and affect the template as a whole.
		 *
		 * @return A <div> element.
		 */
		renderTemplateOptions(): JSX.Element {
			this.inputSet = {
				collapse: new OO.ui.CheckboxInputWidget( {
					selected: this.copiedTemplate.collapsed
				} ),
				small: new OO.ui.CheckboxInputWidget( {
					selected: this.copiedTemplate.small
				} )
			};
			this.fields = {
				collapse: new OO.ui.FieldLayout( this.inputSet.collapse, {
					label: 'Collapse',
					align: 'inline'
				} ),
				small: new OO.ui.FieldLayout( this.inputSet.small, {
					label: 'Small',
					align: 'inline'
				} )
			};
			this.inputSet.collapse.on( 'change', ( value: boolean ) => {
				this.copiedTemplate.collapsed = value;
				this.copiedTemplate.save();
			} );
			this.inputSet.small.on( 'change', ( value: boolean ) => {
				this.copiedTemplate.small = value;
				this.copiedTemplate.save();
			} );

			return <div class="cte-templateOptions">
				<div>{ unwrapWidget( this.fields.collapse ) }</div>
				<div>{ unwrapWidget( this.fields.small ) }</div>
			</div>;
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			/** @member any */
			if ( this.outlineItem !== undefined ) {
				/** @member any */
				this.outlineItem
					.setMovable( true )
					.setRemovable( true )
					.setIcon( 'puzzle' )
					.setLevel( 0 )
					.setLabel( this.label );
			}
		}

	};
}

/**
 * Creates a new CopiedTemplatePage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplatePage object
 */
export default function ( config: CopiedTemplatePageData ) {
	if ( !InternalCopiedTemplatePage ) {
		initCopiedTemplatePage();
	}
	return new InternalCopiedTemplatePage( config );
}
