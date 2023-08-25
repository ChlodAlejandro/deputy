/* eslint-disable camelcase */
import { h } from 'tsx-dom';
import '../../../../types';
import CopiedTemplateRow, {
	CopiedTemplateRowParameter
} from '../../models/templates/CopiedTemplateRow';
import unwrapWidget from '../../../../util/unwrapWidget';
import copyToClipboard from '../../../../util/copyToClipboard';
import getObjectValues from '../../../../util/getObjectValues';
import CopiedTemplateEditorDialog from '../CopiedTemplateEditorDialog';
import { AttributionNoticePageLayout } from './AttributionNoticePageLayout';
import yesNo from '../../../../util/yesNo';
import normalizeTitle from '../../../../wiki/util/normalizeTitle';
import equalTitle from '../../../../util/equalTitle';
import MwApi from '../../../../MwApi';
import RevisionDateGetButton from '../components/RevisionDateGetButton';

export interface CopiedTemplateRowPageData {
	/**
	 * The row that this page refers to.
	 */
	copiedTemplateRow: CopiedTemplateRow;
	/**
	 * The parent of this page.
	 */
	parent: ReturnType<typeof CopiedTemplateEditorDialog>;
}

let InternalCopiedTemplateRowPage: any;

/**
 * The UI representation of a {{copied}} template row. This refers to a set of `diff`, `to`,
 * or `from` parameters on each {{copied}} template.
 *
 * Note that "Page" in the class title does not refer to a MediaWiki page, but rather
 * a OOUI PageLayout.
 */
function initCopiedTemplateRowPage() {
	InternalCopiedTemplateRowPage = class CopiedTemplateRowPage
		extends OO.ui.PageLayout implements AttributionNoticePageLayout {

		outlineItem: OO.ui.OutlineOptionWidget;

		/**
		 * The row that this page refers to.
		 */
		copiedTemplateRow: CopiedTemplateRow;
		/**
		 * The parent of this page.
		 *
		 * Set to `any` due to lack of proper handling for mw.loader.using calls and the like.
		 */
		parent: ReturnType<typeof CopiedTemplateEditorDialog>;

		// ELEMENTS
		/**
		 * An OOUI FieldsetLayout that contains the button set (using `.append`) and
		 * input fields (using `.addItems`)
		 */
		layout: any;
		/**
		 * An array of OOUI InputWidget widgets that represent the fields of this row.
		 */
		inputs: Record<CopiedTemplateRowParameter | 'toggle', any>;
		/**
		 * An array of OOUI FieldLayout widgets that contain inputs for this row.
		 */
		fieldLayouts: Record<CopiedTemplateRowParameter | 'toggle', OO.ui.FieldLayout>;
		/**
		 * The label of this page. Used in the BookletLayout and header.
		 */
		label: string;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: CopiedTemplateRowPageData ) {
			const { copiedTemplateRow, parent } = config;

			if ( parent == null ) {
				throw new Error( 'Parent dialog (CopiedTemplateEditorDialog) is required' );
			} else if ( copiedTemplateRow == null ) {
				throw new Error( 'Reference row (CopiedTemplateRow) is required' );
			}

			const finalConfig = {
				classes: [ 'cte-page-row' ]
			};
			super( copiedTemplateRow.id, finalConfig );

			this.parent = parent;
			this.copiedTemplateRow = copiedTemplateRow;
			this.refreshLabel();

			this.copiedTemplateRow.parent.addEventListener( 'destroy', () => {
				parent.rebuildPages();
			} );
			this.copiedTemplateRow.parent.addEventListener( 'rowDelete', () => {
				parent.rebuildPages();
			} );

			this.$element.append( this.render().$element );
		}

		/**
		 * Refreshes the page's label
		 */
		refreshLabel(): void {
			if ( this.copiedTemplateRow.from && equalTitle(
				this.copiedTemplateRow.from,
				normalizeTitle( this.copiedTemplateRow.parent.parsoid.getPage() )
					.getSubjectPage()
			) ) {
				this.label = mw.message(
					'deputy.ante.copied.entry.shortTo',
					this.copiedTemplateRow.to || '???'
				).text();
			} else if ( this.copiedTemplateRow.to && equalTitle(
				this.copiedTemplateRow.to,
				normalizeTitle( this.copiedTemplateRow.parent.parsoid.getPage() )
					.getSubjectPage()
			) ) {
				this.label = mw.message(
					'deputy.ante.copied.entry.shortFrom',
					this.copiedTemplateRow.from || '???'
				).text();
			} else {
				this.label = mw.message(
					'deputy.ante.copied.entry.short',
					this.copiedTemplateRow.from || '???',
					this.copiedTemplateRow.to || '???'
				).text();
			}
			if ( this.outlineItem ) {
				this.outlineItem.setLabel( this.label );
			}
		}

		/**
		 * Renders this page. Returns a FieldsetLayout OOUI widget.
		 *
		 * @return An OOUI FieldsetLayout
		 */
		render(): OO.ui.FieldsetLayout {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.msg( 'deputy.ante.copied.entry.label' ),
				classes: [ 'cte-fieldset' ]
			} );

			this.layout.$element.append( this.renderButtons() );
			this.layout.addItems( this.renderFields() );

			return this.layout;
		}

		/**
		 * Renders a set of buttons used to modify a specific {{copied}} template row.
		 *
		 * @return An array of OOUI FieldLayouts
		 */
		renderButtons(): JSX.Element {
			const deleteButton = new OO.ui.ButtonWidget( {
				icon: 'trash',
				title: mw.msg( 'deputy.ante.copied.entry.remove' ),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.copiedTemplateRow.parent.deleteRow( this.copiedTemplateRow );
			} );
			const copyButton = new OO.ui.ButtonWidget( {
				icon: 'quotes',
				title: mw.msg( 'deputy.ante.copied.entry.copy' ),
				framed: false
			} );
			copyButton.on( 'click', () => {
				// TODO: Find out a way to l10n-ize this.
				let attributionString = `[[WP:PATT|Attribution]]: Content ${
					this.copiedTemplateRow.merge ? 'merged' : 'partially copied'
				}`;
				let lacking = false;
				if (
					this.copiedTemplateRow.from != null &&
					this.copiedTemplateRow.from.length !== 0
				) {
					attributionString += ` from [[${this.copiedTemplateRow.from}]]`;
				} else {
					lacking = true;
					if ( this.copiedTemplateRow.from_oldid != null ) {
						attributionString += ' from a page';
					}
				}
				if ( this.copiedTemplateRow.from_oldid != null ) {
					attributionString += ` as of revision [[Special:Diff/${
						this.copiedTemplateRow.from_oldid
					}|${
						this.copiedTemplateRow.from_oldid
					}]]`;
				}
				if (
					this.copiedTemplateRow.to_diff != null ||
					this.copiedTemplateRow.to_oldid != null
				) {
					// Shifting will ensure that `to_oldid` will be used if `to_diff` is missing.
					const diffPart1 = this.copiedTemplateRow.to_oldid ||
						this.copiedTemplateRow.to_diff;
					const diffPart2 = this.copiedTemplateRow.to_diff ||
						this.copiedTemplateRow.to_oldid;

					attributionString += ` with [[Special:Diff/${
						diffPart1 === diffPart2 ? diffPart1 : `${diffPart1}/${diffPart2}`
					}|this edit]]`;
				}
				if (
					this.copiedTemplateRow.from != null &&
					this.copiedTemplateRow.from.length !== 0
				) {
					attributionString += `; refer to that page's [[Special:PageHistory/${
						this.copiedTemplateRow.from
					}|edit history]] for additional attribution`;
				}
				attributionString += '.';

				copyToClipboard( attributionString );

				if ( lacking ) {
					mw.notify(
						mw.msg( 'deputy.ante.copied.entry.copy.lacking' ),
						{ title: mw.msg( 'deputy.ante' ), type: 'warn' }
					);
				} else {
					mw.notify(
						mw.msg( 'deputy.ante.copied.entry.copy.success' ),
						{ title: mw.msg( 'deputy.ante' ) }
					);
				}
			} );

			return <div style={{
				float: 'right',
				position: 'absolute',
				top: '0.5em',
				right: '0.5em'
			}}>
				{ unwrapWidget( copyButton )}
				{ unwrapWidget( deleteButton )}
			</div>;
		}

		/**
		 * Renders a set of OOUI InputWidgets and FieldLayouts, eventually returning an
		 * array of each FieldLayout to append to the FieldsetLayout.
		 *
		 * @return An array of OOUI FieldLayouts
		 */
		renderFields(): OO.ui.FieldLayout[] {
			const copiedTemplateRow = this.copiedTemplateRow;
			const parsedDate =
				( copiedTemplateRow.date == null || copiedTemplateRow.date.trim().length === 0 ) ?
					undefined : (
						!isNaN( new Date( copiedTemplateRow.date.trim() + ' UTC' ).getTime() ) ?
							( new Date( copiedTemplateRow.date.trim() + ' UTC' ) ) : (
								!isNaN( new Date( copiedTemplateRow.date.trim() ).getTime() ) ?
									new Date( copiedTemplateRow.date.trim() ) : null
							)
					);

			this.inputs = {
				from: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					placeholder: mw.msg( 'deputy.ante.copied.from.placeholder' ),
					value: copiedTemplateRow.from,
					validate: /^.+$/g
				} ),
				from_oldid: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.copied.from_oldid.placeholder' ),
					value: copiedTemplateRow.from_oldid,
					validate: /^\d*$/
				} ),
				to: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					placeholder: mw.msg( 'deputy.ante.copied.to.placeholder' ),
					value: copiedTemplateRow.to
				} ),
				to_diff: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.copied.to_diff.placeholder' ),
					value: copiedTemplateRow.to_diff,
					validate: /^\d*$/
				} ),

				// Advanced options
				to_oldid: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.copied.to_oldid.placeholder' ),
					value: copiedTemplateRow.to_oldid,
					validate: /^\d*$/
				} ),
				diff: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.copied.diff.placeholder' ),
					value: copiedTemplateRow.diff
				} ),
				merge: new OO.ui.CheckboxInputWidget( {
					selected: yesNo( copiedTemplateRow.merge )
				} ),
				afd: new OO.ui.TextInputWidget( {
					placeholder: mw.msg( 'deputy.ante.copied.afd.placeholder' ),
					value: copiedTemplateRow.afd,
					disabled: copiedTemplateRow.merge === undefined,
					// Prevent people from adding the WP:AFD prefix.
					validate: /^((?!W(iki)?p(edia)?:(A(rticles)?[ _]?f(or)?[ _]?d(eletion)?\/)).+|$)/gi
				} ),
				date: new mw.widgets.DateInputWidget( {
					$overlay: this.parent.$overlay,
					icon: 'calendar',
					value: parsedDate ? `${
						parsedDate.getUTCFullYear()
					}-${
						parsedDate.getUTCMonth() + 1
					}-${
						parsedDate.getUTCDate()
					}` : undefined,
					placeholder: mw.msg( 'deputy.ante.copied.date.placeholder' ),
					calendar: {
						verticalPosition: 'above'
					}
				} ),
				toggle: new OO.ui.ToggleSwitchWidget()
			};

			const diffConvert = new OO.ui.ButtonWidget( {
				label: mw.msg( 'deputy.ante.copied.convert' )
			} );
			const dateAuto = RevisionDateGetButton( {
				label: mw.msg( 'deputy.ante.dateAuto', 'to_diff' ),
				revisionInputWidget: this.inputs.to_diff,
				dateInputWidget: this.inputs.date
			} );

			this.fieldLayouts = {
				from: new OO.ui.FieldLayout( this.inputs.from, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.from.label' ),
					align: 'top',
					help: mw.msg( 'deputy.ante.copied.from.help' )
				} ),
				from_oldid: new OO.ui.FieldLayout( this.inputs.from_oldid, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.from_oldid.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.copied.from_oldid.help' )
				} ),
				to: new OO.ui.FieldLayout( this.inputs.to, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.to.label' ),
					align: 'top',
					help: mw.msg( 'deputy.ante.copied.to.help' )
				} ),
				to_diff: new OO.ui.FieldLayout( this.inputs.to_diff, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.to_diff.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.copied.to_diff.help' )
				} ),

				// Advanced options
				to_oldid: new OO.ui.FieldLayout( this.inputs.to_oldid, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.to_oldid.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.copied.to_oldid.help' )
				} ),
				diff: new OO.ui.ActionFieldLayout( this.inputs.diff, diffConvert, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.diff.label' ),
					align: 'inline',
					help: new OO.ui.HtmlSnippet(
						mw.message( 'deputy.ante.copied.diff.help' ).plain()
					)
				} ),
				merge: new OO.ui.FieldLayout( this.inputs.merge, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.merge.label' ),
					align: 'inline',
					help: mw.msg( 'deputy.ante.copied.merge.help' )
				} ),
				afd: new OO.ui.FieldLayout( this.inputs.afd, {
					$overlay: this.parent.$overlay,
					label: mw.msg( 'deputy.ante.copied.afd.label' ),
					align: 'left',
					help: mw.msg( 'deputy.ante.copied.afd.help' )
				} ),
				date: new OO.ui.ActionFieldLayout( this.inputs.date, dateAuto, {
					align: 'inline',
					classes: [ 'cte-fieldset-date' ]
				} ),
				toggle: new OO.ui.FieldLayout( this.inputs.toggle, {
					label: mw.msg( 'deputy.ante.copied.advanced' ),
					align: 'inline',
					classes: [ 'cte-fieldset-advswitch' ]
				} )
			};

			if ( parsedDate === null ) {
				this.fieldLayouts.date.setWarnings( [
					mw.msg( 'deputy.ante.copied.dateInvalid', copiedTemplateRow.date )
				] );
			}

			// Define options that get hidden when advanced options are toggled
			const advancedOptions = [
				this.fieldLayouts.to_oldid,
				this.fieldLayouts.diff,
				this.fieldLayouts.merge,
				this.fieldLayouts.afd
			];

			// Self-imposed deprecation notice in order to steer away from plain URL
			// diff links. This will, in the long term, make it easier to parse out
			// and edit {{copied}} templates.
			const diffDeprecatedNotice = new OO.ui.HtmlSnippet(
				mw.message( 'deputy.ante.copied.diffDeprecate' ).plain()
			);

			// Hide advanced options
			advancedOptions.forEach( ( e ) => {
				e.toggle( false );
			} );
			// ...except for `diff` if it's supplied (legacy reasons)
			if ( copiedTemplateRow.diff ) {
				this.fieldLayouts.diff.toggle( true );
				this.fieldLayouts.diff.setWarnings( [ diffDeprecatedNotice ] );
			} else {
				diffConvert.setDisabled( true );
			}

			// Attach event listeners
			this.inputs.diff.on( 'change', () => {
				if ( this.inputs.diff.getValue().length > 0 ) {
					try {
						// Check if the diff URL is from this wiki.
						if (
							new URL(
								this.inputs.diff.getValue(), window.location.href
							).host === window.location.host
						) {
							// Prefer `to_oldid` and `to_diff`
							this.fieldLayouts.diff.setWarnings( [ diffDeprecatedNotice ] );
							diffConvert.setDisabled( false );
						} else {
							this.fieldLayouts.diff.setWarnings( [] );
							diffConvert.setDisabled( true );
						}
					} catch ( e ) {
						// Clear warnings just to be safe.
						this.fieldLayouts.diff.setWarnings( [] );
						diffConvert.setDisabled( true );
					}
				} else {
					this.fieldLayouts.diff.setWarnings( [] );
					diffConvert.setDisabled( true );
				}
			} );
			this.inputs.merge.on( 'change', ( value: boolean ) => {
				this.inputs.afd.setDisabled( !value );
			} );
			this.inputs.toggle.on( 'change', ( value: boolean ) => {
				advancedOptions.forEach( ( e ) => {
					e.toggle( value );
				} );
				this.fieldLayouts.to_diff.setLabel(
					value ? 'Ending revision ID' : 'Revision ID'
				);
			} );
			this.inputs.from.on( 'change', () => {
				this.refreshLabel();
			} );
			this.inputs.to.on( 'change', () => {
				this.refreshLabel();
			} );

			for ( const _field in this.inputs ) {
				if ( _field === 'toggle' ) {
					continue;
				}
				const field = _field as CopiedTemplateRowParameter;
				const input = this.inputs[ field ];

				// Attach the change listener
				input.on( 'change', ( value: string ) => {
					if ( input instanceof OO.ui.CheckboxInputWidget ) {
						// Specific to `merge`. Watch out before adding more checkboxes.
						this.copiedTemplateRow[ field ] = value ? 'yes' : '';
					} else if ( input instanceof mw.widgets.DateInputWidget ) {
						this.copiedTemplateRow[ field ] = value ?
							new Date( value + 'T00:00:00Z' ).toLocaleDateString( 'en-GB', {
								year: 'numeric', month: 'long', day: 'numeric'
							} ) : undefined;
						if ( value.length > 0 ) {
							this.fieldLayouts[ field ].setWarnings( [] );
						}
					} else {
						this.copiedTemplateRow[ field ] = value;
					}
					copiedTemplateRow.parent.save();
					this.refreshLabel();
				} );

				if ( input instanceof OO.ui.TextInputWidget ) {
					// Rechecks the validity of the field.
					input.setValidityFlag();
				}
			}

			// Diff convert click handler
			diffConvert.on( 'click', this.convertDeprecatedDiff.bind( this ) );

			return getObjectValues( this.fieldLayouts );
		}

		/**
		 * Converts a raw diff URL on the same wiki as the current to use `to` and `to_oldid`
		 * (and `to_diff`, if available).
		 */
		convertDeprecatedDiff(): void {
			const value = this.inputs.diff.getValue();
			try {
				const url = new URL( value, window.location.href );
				if ( !value ) {
					return;
				}
				if ( url.host === window.location.host ) {
					console.warn( 'Attempted to convert a diff URL from another wiki.' );
				}
				// From the same wiki, accept deprecation

				// Attempt to get values from URL parameters (when using `/w/index.php?action=diff`)
				let oldid = url.searchParams.get( 'oldid' );
				let diff = url.searchParams.get( 'diff' );
				const title = url.searchParams.get( 'title' );

				// Attempt to get values from Special:Diff short-link
				const diffSpecialPageCheck =
					/\/wiki\/Special:Diff\/(prev|next|\d+)(?:\/(prev|next|\d+))?/.exec( url.pathname );
				if ( diffSpecialPageCheck != null ) {
					if (
						diffSpecialPageCheck[ 1 ] != null &&
						diffSpecialPageCheck[ 2 ] == null
					) {
						// Special:Diff/diff
						diff = diffSpecialPageCheck[ 1 ];
					} else if (
						diffSpecialPageCheck[ 1 ] != null &&
						diffSpecialPageCheck[ 2 ] != null
					) {
						// Special:Diff/oldid/diff
						oldid = diffSpecialPageCheck[ 1 ];
						diff = diffSpecialPageCheck[ 2 ];
					}
				}

				const confirmProcess = new OO.ui.Process();
				for ( const [ _rowName, newValue ] of [
					[ 'to_oldid', oldid ],
					[ 'to_diff', diff ],
					[ 'to', title ]
				] ) {
					const rowName = _rowName as CopiedTemplateRowParameter;
					if ( newValue == null ) {
						continue;
					}
					if (
						// Field has an existing value
						this.copiedTemplateRow[ rowName ] != null &&
						this.copiedTemplateRow[ rowName ].length > 0 &&
						this.copiedTemplateRow[ rowName ] !== newValue
					) {
						confirmProcess.next( async () => {
							const confirmPromise = OO.ui.confirm(
								mw.message(
									'deputy.ante.copied.diffDeprecate.replace',
									rowName, this.copiedTemplateRow[ rowName ], newValue
								).text()
							);
							confirmPromise.done( ( confirmed: boolean ) => {
								if ( confirmed ) {
									this.inputs[ rowName ].setValue( newValue );
								}
							} );
							return confirmPromise;
						} );
					} else {
						this.inputs[ rowName ].setValue( newValue );
					}
				}
				confirmProcess.next( () => {
					this.copiedTemplateRow.parent.save();
					this.inputs.diff.setValue( '' );

					if ( !this.inputs.toggle.getValue() ) {
						this.fieldLayouts.diff.toggle( false );
					}
				} );
				confirmProcess.execute();
			} catch ( e ) {
				console.error( 'Cannot convert `diff` parameter to URL.', e );
				OO.ui.alert( mw.msg( 'deputy.ante.copied.diffDeprecate.failed' ) );
			}
		}

		/**
		 * Sets up the outline item of this page. Used in the BookletLayout.
		 */
		setupOutlineItem() {
			if ( this.outlineItem !== undefined ) {
				this.outlineItem
					.setMovable( true )
					.setRemovable( true )
					.setIcon( 'parameter' )
					.setLevel( 1 )
					.setLabel( this.label );
			}
		}

	};
}

/**
 * Creates a new CopiedTemplateRowPage.
 *
 * @param config Configuration to be passed to the element.
 * @return A CopiedTemplateRowPage object
 */
export default function ( config: CopiedTemplateRowPageData ): AttributionNoticePageLayout {
	if ( !InternalCopiedTemplateRowPage ) {
		initCopiedTemplateRowPage();
	}
	return new InternalCopiedTemplateRowPage( config );
}
