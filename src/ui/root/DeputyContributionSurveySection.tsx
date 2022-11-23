import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../../wiki/DeputyCasePage';
import { DeputyUIElement } from '../DeputyUIElement';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
import ContributionSurveySection from '../../models/ContributionSurveySection';
import DeputyReviewDialog from './DeputyReviewDialog';
import swapElements from '../../util/swapElements';
import sectionHeadingName from '../../wiki/util/sectionHeadingName';
import getSectionId from '../../wiki/util/getSectionId';
import getSectionHTML from '../../wiki/util/getSectionHTML';
import removeElement from '../../util/removeElement';
import decorateEditSummary from '../../wiki/util/decorateEditSummary';
import MwApi from '../../MwApi';
import msgEval from '../../wiki/util/msgEval';
import {
	ContributionSurveyRowSigningBehavior
} from '../../models/ContributionSurveyRowSigningBehavior';
import { generateTrace } from '../../models/DeputyTrace';
import DeputyMessageWidget from '../shared/DeputyMessageWidget';
import sectionHeadingN from '../../wiki/util/sectionHeadingN';

/**
 * The contribution survey section UI element. This includes a list of revisions
 * (which are {@link DeputyContributionSurveyRow} objects), a "close section"
 * checkbox, a "comments" input box (for additional comments when closing the
 * section), a "cancel" button and a "save" button.
 */
export default class DeputyContributionSurveySection implements DeputyUIElement {

	disabled: boolean;

	casePage: DeputyCasePage;
	private _section: ContributionSurveySection;
	heading: HTMLHeadingElement;
	headingName: string;
	headingN: number;
	sectionElements: HTMLElement[];
	originalList: HTMLElement;
	/**
	 * Revision ID of the actively-used wikitext. Used for detecting edit conflicts.
	 */
	revid: number;

	// UI elements (no OOUI types, fall back to `any`)
	container: HTMLElement;
	rows: DeputyContributionSurveyRow[];
	closingCheckbox: any;
	closingComments: any;
	closeButton: any;
	reviewButton: any;
	saveButton: any;

	/**
	 * A collection of strings or DeputyContributionSurveyRows. Used to build the
	 * section wikitext in a manner that preserves all non-CSR lines.
	 */
	wikitextLines: ( DeputyContributionSurveyRow | string )[];

	/**
	 * @return `true` if this section has been modified
	 */
	get modified(): boolean {
		return this.rows && this.rows.length > 0 &&
			this.rows.some( ( row ) => row.modified ) || (
			this._section && this._section.originallyClosed !== this.closed
		);
	}

	/**
	 * @return `true` if this section is (or will be) closed
	 */
	get closed(): boolean {
		return this._section?.closed;
	}
	/**
	 * Sets the close state of this section
	 */
	set closed( value: boolean ) {
		if ( this._section?.closed == null ) {
			throw new Error( 'Section has not been loaded yet.' );
		}
		this._section.closed = value;
	}

	/**
	 * @return The closing comments for this section
	 */
	get comments(): string {
		return this._section?.closingComments;
	}
	/**
	 * Sets the comments of a section.
	 */
	set comments( value: string ) {
		if ( this._section == null ) {
			throw new Error( 'Section has not been loaded yet.' );
		}
		this._section.closingComments = value;
	}

	/**
	 * @return The wikitext for this section.
	 */
	get wikitext(): string {
		let final: string[] = [];

		for ( const obj of this.wikitextLines ) {
			if ( typeof obj === 'string' ) {
				final.push( obj );
			} else {
				final.push( obj.wikitext );
			}
		}

		let lastModifiedRowIndex: keyof typeof final;
		for ( const i in final ) {
			const wikitext = final[ +i ];
			if ( wikitext.indexOf( ' ~~~~' ) !== -1 ) {
				lastModifiedRowIndex = +i;
			}
		}

		const trace = ` ${generateTrace()}`;
		if ( lastModifiedRowIndex != null ) {
			// If `lastModifiedRowIndex` exists, we can assume that a modified row exists.
			// This prevents the following from running on unmodified rows, which is
			// wasteful.
			switch ( window.deputy.config.cci.signingBehavior.get() ) {
				case ContributionSurveyRowSigningBehavior.AlwaysTrace:
					final = final.map( ( line ) => {
						return line.replace( / ~~~~$/, trace );
					} );
					break;
				case ContributionSurveyRowSigningBehavior.AlwaysTraceLastOnly:
					final = final.map( ( line, i ) => {
						if ( i !== lastModifiedRowIndex ) {
							return line.replace( / ~~~~$/, trace );
						} else {
							return line;
						}
					} );
					break;
				case ContributionSurveyRowSigningBehavior.LastOnly:
					final = final.map( ( line, i ) => {
						if ( i !== lastModifiedRowIndex ) {
							return line.replace( / ~~~~$/, '' );
						} else {
							return line;
						}
					} );
					break;
				case ContributionSurveyRowSigningBehavior.Never:
					final = final.map( ( line ) => {
						return line.replace( / ~~~~$/, '' );
					} );
					break;
			}
		}

		if ( this.closed ) {
			final.splice( 1, 0, msgEval(
				window.deputy.wikiConfig.cci.collapseTop.get(),
				( ( this.comments ?? '' ) + ' ~~~~' ).trim()
			).plain() );

			if ( final[ final.length - 1 ].trim().length === 0 ) {
				final.pop();
			}
			final.push( window.deputy.wikiConfig.cci.collapseBottom.get() );
		}

		return final.join( '\n' );
	}

	/**
	 * @return The edit summary for this section's changes.
	 */
	get editSummary(): string {
		if ( this.modified ) {
			const modified = this.rows.filter( ( row ) => row.modified );
			let worked = 0;
			let assessed = 0;
			let finished = 0;
			let reworked = 0;

			for ( const row of modified ) {
				if ( !row.wasFinished ) {
					worked++;
					assessed += row.revisions?.filter( ( rev ) => rev.completed ).length;
					if ( row.completed ) {
						finished++;
					}
				} else {
					reworked++;
				}
			}

			const message: string[] = [];
			if ( assessed > 0 ) {
				message.push(
					mw.msg(
						'deputy.content.assessed',
						`${assessed}`, `${worked}`
					)
				);
			}
			if ( finished > 0 ) {
				message.push(
					mw.msg( 'deputy.content.assessed.finished', `${finished}` )
				);
			}
			if ( reworked > 0 ) {
				message.push(
					mw.msg( 'deputy.content.assessed.reworked', `${reworked}` )
				);
			}

			if ( !this._section.originallyClosed && this.closed ) {
				// Now closed.
				message.push( mw.msg( 'deputy.content.assessed.sectionClosed' ) );
			}

			const m = message.join( mw.msg( 'deputy.content.assessed.comma' ) );
			return m[ 0 ].toUpperCase() + m.slice( 1 );
		} else {
			return mw.msg( 'deputy.content.reformat' );
		}
	}

	/**
	 * Creates a DeputyContributionSurveySection from a given heading.
	 *
	 * @param casePage
	 * @param heading
	 */
	constructor( casePage: DeputyCasePage, heading: ContributionSurveyHeading ) {
		this.casePage = casePage;
		this.heading = heading;
		this.headingName = sectionHeadingName( this.heading );
		this.headingN = sectionHeadingN( this.heading, this.headingName );
		this.sectionElements = casePage.getContributionSurveySection( heading );
	}

	/**
	 * Get the ContributionSurveySection for this section
	 *
	 * @param wikitext Internal use only. Used to skip section loading using existing wikitext.
	 */
	async getSection( wikitext?: string & { revid: number } ): Promise<ContributionSurveySection> {
		const collapsible = this.sectionElements.find(
			( v: HTMLElement ) => v.querySelector( '.mw-collapsible' )
		)?.querySelector( '.mw-collapsible' ) ?? null;

		const sectionWikitext = await this.casePage.wikitext.getSectionWikitext(
			this.headingName,
			this.headingN
		);
		return this._section ?? (
			this._section = new ContributionSurveySection(
				this.casePage,
				this.headingName,
				collapsible != null,
				collapsible?.querySelector<HTMLElement>( 'th > div' ).innerText,
				wikitext ?? sectionWikitext,
				wikitext ? wikitext.revid : sectionWikitext.revid
			)
		);
	}

	/**
	 * Perform any required pre-render operations.
	 *
	 * @return `true` if prepared successfully.
	 *         `false` if not (invalid section, already closed, etc.)
	 */
	async prepare(): Promise<boolean> {
		const firstList = this.sectionElements.find( ( el ) => el.tagName === 'UL' );

		if ( firstList == null ) {
			// Not a valid section! Might be closed already.
			return false;
		}

		this.originalList = firstList.parentElement.removeChild( firstList ) as HTMLElement;

		const rowElements: Record<string, HTMLLIElement> = {};
		for ( let i = 0; i < this.originalList.children.length; i++ ) {
			const li = this.originalList.children.item( i );
			if ( li.tagName !== 'LI' ) {
				return false;
			}
			const anchor: HTMLElement = li.querySelector( 'a:first-of-type' );
			// Avoid enlisting if the anchor can't be found (invalid row).
			if ( anchor ) {
				rowElements[ new mw.Title( anchor.innerText ).getPrefixedText() ] =
					li as HTMLLIElement;
			}
		}

		const section = await this.getSection();
		const sectionWikitext = section.originalWikitext;
		this.revid = section.revid;

		const wikitextLines = sectionWikitext.split( '\n' );
		this.rows = [];
		this.wikitextLines = [];
		for ( let i = 0; i < wikitextLines.length; i++ ) {
			const line = wikitextLines[ i ];

			let rowElement;
			try {
				const csr = new ContributionSurveyRow( this.casePage, line );
				rowElement = new DeputyContributionSurveyRow(
					csr, rowElements[ csr.title.getPrefixedText() ], line, this
				);
			} catch ( e ) {
				// Only trigger on actual bulleted lists.
				if ( /^\*[^*]+/.test( line ) ) {
					console.warn( 'Could not parse row.', line, e );
					// For debugging and tests.
					mw.hook( 'deputy.errors.cciRowParse' ).fire( {
						line, error: e.toString()
					} );
				}
				rowElement = line;
			}
			if ( typeof rowElement !== 'string' ) {
				this.rows.push( rowElement );
			}
			this.wikitextLines.push( rowElement );
		}

		return true;
	}

	/**
	 * Destroys the element from the DOM and re-inserts in its place the original list.
	 * This *should* return the section back to its original look. This does *NOT*
	 * remove the section from the session or cache. Use `DeputySession.closeSection`
	 * instead.
	 */
	close(): void {
		swapElements( this.container, this.originalList );

		// Detach listeners to stop listening to events.
		this.rows.forEach( ( row ) => {
			row.close();
		} );
	}

	/**
	 * Toggles the closing comments input box. This will disable the input box AND
	 * hide the element from view.
	 *
	 * @param show
	 */
	toggleClosingComments( show: boolean ) {
		this.closingComments.setDisabled( !show );
		this.closingComments.toggle( show );
	}

	/**
	 * Sets the disabled state of this section.
	 *
	 * @param disabled
	 */
	setDisabled( disabled: boolean ) {
		this.closeButton?.setDisabled( disabled );
		this.reviewButton?.setDisabled( disabled );
		this.saveButton?.setDisabled( disabled );
		this.closingCheckbox?.setDisabled( disabled );
		this.closingComments?.setDisabled( disabled );
		this.rows?.forEach( ( row ) => row.setDisabled( disabled ) );

		this.disabled = disabled;
	}

	/**
	 * Saves the current section to the case page.
	 *
	 * @param sectionId
	 */
	async save( sectionId: number ): Promise<any | false> {
		if ( sectionId == null ) {
			mw.notify(
				mw.msg( 'deputy.session.section.missingSection' ),
				{
					autoHide: false,
					title: mw.msg( 'deputy.session.section.failed' ),
					type: 'error'
				}
			);
		}

		return MwApi.action.postWithEditToken( {
			action: 'edit',
			pageid: this.casePage.pageId,
			section: sectionId,
			text: this.wikitext,
			baserevid: this.revid,
			summary: decorateEditSummary( this.editSummary )
		} ).then( function ( data ) {
			return data;
		}, ( code, data ) => {
			if ( code === 'editconflict' ) {
				// Wipe cache.
				this.casePage.wikitext.resetCachedWikitext();
				OO.ui.alert(
					mw.msg( 'deputy.session.section.conflict.help' ),
					{
						title: mw.msg( 'deputy.session.section.conflict.title' )
					}
				).then( () => {
					window.deputy.session.rootSession.restartSession();
				} );
				return false;
			}

			mw.notify(
				<span dangerouslySetInnerHTML={
					data.errors[ 0 ].html
				} /> as HTMLElement,
				{
					autoHide: false,
					title: mw.msg( 'deputy.session.section.failed' ),
					type: 'error'
				}
			);
			return false;
		} );
	}

	/**
	 * Makes all rows of this section being loading data.
	 *
	 * @return A Promise that resolves when all rows have finished loading data.
	 */
	async loadData(): Promise<void> {
		// For debugging and tests.
		if ( ( window.deputy as any ).NO_ROW_LOADING !== true ) {
			await Promise.all( this.rows.map( row => row.loadData() ) );
		}
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.closingCheckbox = new OO.ui.CheckboxInputWidget();
		this.closingComments = new OO.ui.TextInputWidget( {
			placeholder: mw.msg( 'deputy.session.section.closeComments' ),
			disabled: true
		} );
		this.closeButton = new OO.ui.ButtonWidget( {
			label: mw.msg( 'deputy.session.section.stop' )
		} );
		this.reviewButton = new OO.ui.ButtonWidget( {
			label: mw.msg( 'deputy.review' )
		} );
		this.saveButton = new OO.ui.ButtonWidget( {
			label: mw.msg( 'deputy.save' ),
			flags: [ 'primary', 'progressive' ]
		} );

		const saveContainer = <div class="dp-cs-section-progress">
			{ unwrapWidget( new OO.ui.ProgressBarWidget( {
				progress: false
			} ) ) }
		</div>;

		this.closeButton.on( 'click', async () => {
			if ( this.wikitext !== ( await this.getSection() ).originalWikitext ) {
				OO.ui.confirm(
					mw.msg( 'deputy.session.section.closeWarn' )
				).done( ( confirmed: boolean ) => {
					if ( confirmed ) {
						this.close();
						window.deputy.session.rootSession.closeSection( this );
					}
				} );
			} else {
				this.close();
				await window.deputy.session.rootSession.closeSection( this );
			}
		} );

		this.reviewButton.on( 'click', async () => {
			const reviewDialog = DeputyReviewDialog( {
				from: ( await this.getSection() ).originalWikitext,
				to: this.wikitext,
				title: this.casePage.title
			} );
			window.deputy.windowManager.addWindows( [ reviewDialog ] );
			window.deputy.windowManager.openWindow( reviewDialog );
		} );

		this.saveButton.on( 'click', async () => {
			this.setDisabled( true );
			saveContainer.classList.add( 'active' );

			const sectionId = await getSectionId(
				this.casePage.title,
				this.headingName,
				this.headingN
			);
			await this.save( sectionId ).then( async ( result ) => {
				if ( result ) {
					mw.notify(
						mw.msg( 'deputy.session.section.saved' )
					);

					// Rebuild the entire section to HTML, and then reopen.
					const {
						element, wikitext, revid
					} = await getSectionHTML( this.casePage.title, sectionId );

					removeElement( this.container );
					const sectionElements =
						this.casePage.getContributionSurveySection( this.heading );
					sectionElements.forEach( ( el ) => removeElement( el ) );

					this.sectionElements = [];
					const oldHeading = this.heading;
					for ( const child of Array.from( element.children ) ) {
						oldHeading.insertAdjacentElement( 'beforebegin', child );
						this.sectionElements.push( child as HTMLElement );

						if ( this.casePage.isContributionSurveyHeading( child as HTMLElement ) ) {
							this.heading = child as ContributionSurveyHeading;
							this.headingName =
								sectionHeadingName( child as ContributionSurveyHeading );
						}
					}
					this.originalList = element;

					if ( !this._section.closed ) {
						this._section = null;
						await this.getSection( Object.assign( wikitext, { revid } ) );
						await this.prepare();
						oldHeading.insertAdjacentElement( 'afterend', this.render() );
						// Run this asynchronously.
						setTimeout( this.loadData.bind( this ), 0 );
					}

					removeElement( oldHeading );
				}
			}, ( error ) => {
				console.error( error );
				saveContainer.classList.remove( 'active' );
				this.setDisabled( false );
			} );

			saveContainer.classList.remove( 'active' );
			this.setDisabled( false );
		} );

		const closingWarning = DeputyMessageWidget( {
			classes: [ 'dp-cs-section-unfinishedWarning' ],
			type: 'warning',
			label: mw.msg( 'deputy.session.section.closeWarning' )
		} );
		closingWarning.toggle( false );
		const updateClosingWarning = ( () => {
			closingWarning.toggle( this.rows.some( ( row ) => !row.completed ) );
		} );

		const closingCommentsField = new OO.ui.FieldLayout( this.closingComments, {
			align: 'top',
			label: 'Closing comments',
			invisibleLabel: true,
			help: mw.msg( 'deputy.session.section.closeHelp' ),
			helpInline: true,
			classes: [ 'dp-cs-section-closingCommentsField' ]
		} );
		// Hide by default.
		closingCommentsField.toggle( false );
		closingCommentsField.on( 'change', ( v: string ) => {
			this.comments = v;
		} );

		this.toggleClosingComments( false );
		this.closingCheckbox.on( 'change', ( v: boolean ) => {
			this.closed = v;
			closingCommentsField.toggle( v );
			this.toggleClosingComments( v );

			if ( v ) {
				updateClosingWarning();
				this.rows.forEach( ( row ) => {
					row.addEventListener( 'update', updateClosingWarning );
				} );
			} else {
				closingWarning.toggle( false );
				this.rows.forEach( ( row ) => {
					row.removeEventListener( 'update', updateClosingWarning );
				} );
			}
		} );
		this.closingComments.on( 'change', ( v: string ) => {
			this.comments = v;
		} );

		( window as any ).test = this;

		return this.container = <div class="deputy dp-cs-section">
			<div>
				{ this.rows.map( ( row ) => row.render() ) }
			</div>
			<div class="dp-cs-section-footer">
				<div style={{ display: 'flex' }}>
					<div style={{
						flex: '1',
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center'
					}}>
						{ unwrapWidget( new OO.ui.FieldLayout( this.closingCheckbox, {
							align: 'inline',
							label: mw.msg( 'deputy.session.section.close' )
						} ) ) }
						{ unwrapWidget( closingWarning ) }
						{ unwrapWidget( closingCommentsField ) }
					</div>
					<div style={{ display: 'flex', alignItems: 'end' }}>
						{ unwrapWidget( this.closeButton ) }
						{ unwrapWidget( this.reviewButton ) }
						{ unwrapWidget( this.saveButton ) }
					</div>
				</div>
				{ saveContainer }
			</div>
		</div> as HTMLElement;
	}

}
