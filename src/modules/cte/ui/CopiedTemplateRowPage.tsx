/* eslint-disable camelcase */
import '../../../types';
import { h } from 'tsx-dom';
import CopiedTemplateRow, { CopiedTemplateRowParameter } from '../models/CopiedTemplateRow';
import RowChangeEvent from '../models/RowChangeEvent';
import unwrapWidget from '../../../util/unwrapWidget';
import copyToClipboard from '../../../util/copyToClipboard';
import getObjectValues from '../../../util/getObjectValues';
import CopiedTemplateEditorDialog from './CopiedTemplateEditorDialog';

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
	InternalCopiedTemplateRowPage = class CopiedTemplateRowPage extends OO.ui.PageLayout {

		/**
		 * The row that this page refers to.
		 */
		copiedTemplateRow: CopiedTemplateRow;
		/**
		 * The parent of this page.
		 *
		 * Set to `any` due to OOUI's lack of proper TypeScript support.
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
		fieldLayouts: Record<CopiedTemplateRowParameter | 'toggle', any>;

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
				label: `${copiedTemplateRow.from || '???'} to ${copiedTemplateRow.to || '???'}`,
				icon: 'parameter',
				level: 1,
				classes: [ 'cte-page-row' ]
			};
			super( copiedTemplateRow.id, finalConfig );

			this.copiedTemplateRow = config.copiedTemplateRow;

			this.copiedTemplateRow.parent.addEventListener( 'destroy', () => {
				// Check if the page hasn't been deleted yet.
				if ( parent.layout.getPage( this.name ) ) {
					parent.layout.removePages( [ this ] );
				}
			} );
			this.copiedTemplateRow.parent.addEventListener(
				'rowDelete',
				( event: RowChangeEvent ) => {
					if ( event.row.id === this.name ) {
						parent.layout.removePages( [ this ] );
					}
				}
			);

			this.$element.append( this.render().$element );
		}

		/**
		 * Renders this page. Returns a FieldsetLayout OOUI widget.
		 *
		 * @return An OOUI FieldsetLayout
		 */
		render(): any {
			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: 'Template row',
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
				title: mw.message( 'deputy.cte.copied.entry.remove' ).text(),
				framed: false,
				flags: [ 'destructive' ]
			} );
			deleteButton.on( 'click', () => {
				this.copiedTemplateRow.parent.deleteRow( this.copiedTemplateRow );
			} );
			const copyButton = new OO.ui.ButtonWidget( {
				icon: 'quotes',
				title: mw.message( 'deputy.cte.copied.entry.copy' ).text(),
				framed: false
			} );
			copyButton.on( 'click', () => {
				// TODO: Find out a way to i18n-ize this.
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
						mw.message( 'deputy.cte.copied.entry.copy.lacking' ).text(),
						{ title: mw.message( 'deputy.cte' ).text(), type: 'warn' }
					);
				} else {
					mw.notify(
						mw.message( 'deputy.cte.copied.entry.copy.success' ).text(),
						{ title: mw.message( 'deputy.cte' ).text() }
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
		renderFields(): any[] {
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

			this.layout = new OO.ui.FieldsetLayout( {
				icon: 'parameter',
				label: mw.message( 'deputy.cte.copied.entry.label' ).text(),
				classes: [ 'cte-fieldset' ]
			} );
			this.inputs = {
				from: new mw.widgets.TitleInputWidget( {
					$overlay: this.this.parent.$overlay,
					placeholder: mw.message( 'deputy.cte.copied.from.placeholder' ).text(),
					value: copiedTemplateRow.from,
					validate: /^.+$/g
				} ),
				from_oldid: new OO.ui.TextInputWidget( {
					placeholder: mw.message( 'deputy.cte.copied.from_oldid.placeholder' ).text(),
					value: copiedTemplateRow.from_oldid,
					validate: /^\d*$/
				} ),
				to: new mw.widgets.TitleInputWidget( {
					$overlay: this.parent.$overlay,
					placeholder: mw.message( 'deputy.cte.copied.to.placeholder' ).text(),
					value: copiedTemplateRow.to
				} ),
				to_diff: new OO.ui.TextInputWidget( {
					placeholder: mw.message( 'deputy.cte.copied.to_diff.placeholder' ).text(),
					value: copiedTemplateRow.to_diff,
					validate: /^\d*$/
				} ),

				// Advanced options
				to_oldid: new OO.ui.TextInputWidget( {
					placeholder: mw.message( 'deputy.cte.copied.to_oldid.placeholder' ).text(),
					value: copiedTemplateRow.to_oldid,
					validate: /^\d*$/
				} ),
				diff: new OO.ui.TextInputWidget( {
					placeholder: mw.message( 'deputy.cte.copied.diff.placeholder' ).text(),
					value: copiedTemplateRow.diff
				} ),
				merge: new OO.ui.CheckboxInputWidget( {
					value: copiedTemplateRow.merge !== undefined
				} ),
				afd: new OO.ui.TextInputWidget( {
					placeholder: mw.message( 'deputy.cte.copied.afd.placeholder' ).text(),
					value: copiedTemplateRow.afd,
					disabled: copiedTemplateRow.merge === undefined,
					// Prevent people from adding the WP:AFD prefix.
					validate: /^((?!W(iki)?p(edia)?:(A(rticles)?[ _]?f(or)?[ _]?d(eletion)?\/)).+|$)/gi
				} ),
				date: new mw.widgets.datetime.DateTimeInputWidget( {
					// calendar: {
					//     $overlay: parent["$overlay"]
					// },
					calendar: null,
					icon: 'calendar',
					clearable: true,
					value: parsedDate
				} ),
				toggle: new OO.ui.ToggleSwitchWidget()
			};

			const diffConvert = new OO.ui.ButtonWidget( {
				label: 'Convert'
			} );
			// const dateButton = new OO.ui.PopupButtonWidget({
			//     icon: "calendar",
			//     title: "Select a date"
			// });

			this.fieldLayouts = {
				from: new OO.ui.FieldLayout( this.inputs.from, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.from.label' ).text(),
					align: 'top',
					help: mw.message( 'deputy.cte.copied.from.help' ).text()
				} ),
				from_oldid: new OO.ui.FieldLayout( this.inputs.from_oldid, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.from_oldid.label' ).text(),
					align: 'left',
					help: mw.message( 'deputy.cte.copied.from_oldid.help' ).text()
				} ),
				to: new OO.ui.FieldLayout( this.inputs.to, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.to.label' ).text(),
					align: 'top',
					help: mw.message( 'deputy.cte.copied.to.help' ).text()
				} ),
				to_diff: new OO.ui.FieldLayout( this.inputs.to_diff, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.to_diff.label' ).text(),
					align: 'left',
					help: mw.message( 'deputy.cte.copied.to_diff.help' ).text()
				} ),

				// Advanced options
				to_oldid: new OO.ui.FieldLayout( this.inputs.to_oldid, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.to_oldid.label' ).text(),
					align: 'left',
					help: mw.message( 'deputy.cte.copied.to_oldid.help' ).text()
				} ),
				diff: new OO.ui.ActionFieldLayout( this.inputs.diff, diffConvert, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.diff.label' ).text(),
					align: 'inline',
					help: new OO.ui.HtmlSnippet(
						mw.message( 'deputy.cte.copied.diff.help' ).plain()
					)
				} ),
				merge: new OO.ui.FieldLayout( this.inputs.merge, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.merge.label' ).text(),
					align: 'inline',
					help: mw.message( 'deputy.cte.copied.merge.help' ).text()
				} ),
				afd: new OO.ui.FieldLayout( this.inputs.afd, {
					$overlay: this.parent.$overlay,
					label: mw.message( 'deputy.cte.copied.afd.label' ).text(),
					align: 'left',
					help: mw.message( 'deputy.cte.copied.afd.help' ).text()
				} ),
				date: new OO.ui.FieldLayout( this.inputs.date, {
					align: 'inline',
					classes: [ 'cte-fieldset-date' ]
				} ),
				toggle: new OO.ui.FieldLayout( this.inputs.toggle, {
					label: mw.message( 'deputy.cte.copied.advanced' ).text(),
					align: 'inline',
					classes: [ 'cte-fieldset-advswitch' ]
				} )
			};

			if ( parsedDate === null ) {
				this.fieldLayouts.date.setWarnings( [
					mw.message( 'deputy.cte.copied.dateInvalid', copiedTemplateRow.date ).text()
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
				mw.message( 'deputy.cte.copied.diffDeprecate' ).plain()
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
							// TODO: l10n
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
				/** @member any */
				this.outlineItem.setLabel(
					`${this.inputs.from.value || '???'} to ${this.inputs.to.value || '???'}`
				);
			} );
			this.inputs.to.on( 'change', () => {
				/** @member any */
				this.outlineItem.setLabel(
					`${this.inputs.from.value || '???'} to ${this.inputs.to.value || '???'}`
				);
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
						this.copiedTemplateRow[ field ] = value ? 'yes' : '';
					} else if ( input instanceof mw.widgets.datetime.DateTimeInputWidget ) {
						this.copiedTemplateRow[ field ] =
							new Date( value ).toLocaleDateString( 'en-GB', {
								year: 'numeric', month: 'long', day: 'numeric'
							} );
						if ( value.length > 0 ) {
							this.fieldLayouts[ field ].setWarnings( [] );
						}
					} else {
						this.copiedTemplateRow[ field ] = value;
					}
					copiedTemplateRow.parent.save();
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
									'deputy.cte.copied.diffDeprecate.replace',
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
				OO.ui.alert( mw.message( 'deputy.cte.copied.diffDeprecate.failed' ).text() );
			}
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
					.setIcon( this.icon )
					.setLevel( this.level )
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
export default function ( config: CopiedTemplateRowPageData ) {
	if ( !InternalCopiedTemplateRowPage ) {
		initCopiedTemplateRowPage();
	}
	return new InternalCopiedTemplateRowPage( config );
}
