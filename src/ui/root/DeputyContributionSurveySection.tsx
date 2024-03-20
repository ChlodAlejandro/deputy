import { h } from 'tsx-dom';
import DeputyCasePage, { ContributionSurveyHeading } from '../../wiki/DeputyCasePage';
import { DeputyUIElement } from '../DeputyUIElement';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyContributionSurveyRow from './DeputyContributionSurveyRow';
import ContributionSurveyRow from '../../models/ContributionSurveyRow';
import ContributionSurveySection from '../../models/ContributionSurveySection';
import DeputyReviewDialog from './DeputyReviewDialog';
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
import changeTag from '../../config/changeTag';
import DeputyExtraneousElement from './DeputyExtraneousElement';
import classMix from '../../util/classMix';

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
	sectionNodes: Node[];
	originalList: HTMLElement;
	/**
	 * Revision ID of the actively-used wikitext. Used for detecting edit conflicts.
	 */
	revid: number;

	// UI elements
	container: HTMLElement;
	rows: DeputyContributionSurveyRow[];
	rowElements: ( HTMLElement | DeputyContributionSurveyRow )[];
	closingCheckbox: OO.ui.CheckboxInputWidget;
	closingComments: OO.ui.TextInputWidget;
	closingCommentsSign: OO.ui.CheckboxInputWidget;
	closeButton: OO.ui.ButtonWidget;
	reviewButton: OO.ui.ButtonWidget;
	saveButton: OO.ui.ButtonWidget;

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
			if ( !this._section.originallyClosed ) {
				let closingComments = ( this.comments ?? '' ).trim();
				if ( this.closingCommentsSign.isSelected() ) {
					closingComments += ' ~~~~';
				}

				final.splice( 1, 0, msgEval(
					window.deputy.wikiConfig.cci.collapseTop.get(),
					closingComments
				).plain() );

				if ( final[ final.length - 1 ].trim().length === 0 ) {
					final.pop();
				}
				final.push( window.deputy.wikiConfig.cci.collapseBottom.get() );
			}
			// If the section was originally closed, don't allow the archiving
			// message to be edited.
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

			const nowClosed = !this._section.originallyClosed && this.closed;
			if ( nowClosed ) {
				message.push( mw.msg( 'deputy.content.assessed.sectionClosed' ) );
			}

			const m = message.join( mw.msg( 'deputy.content.assessed.comma' ) );

			if ( m.length === 0 ) {
				return mw.msg( 'deputy.content.reformat' );
			}

			const summary = mw.msg(
				nowClosed ?
					'deputy.content.summary.sectionClosed' :
					( finished === 0 && assessed > 0 ?
						'deputy.content.summary.partial' :
						'deputy.content.summary' ),
				this.headingName,
				finished
			);
			return summary + m[ 0 ].toUpperCase() + m.slice( 1 );
		} else {
			return mw.msg( 'deputy.content.reformat' );
		}
	}

	/**
	 * @return the name of the section heading.
	 */
	get headingName(): string {
		return sectionHeadingName( this.heading );
	}

	/**
	 * @return the `n` of the section heading, if applicable.
	 */
	get headingN(): number {
		return sectionHeadingN( this.heading, this.headingName );
	}

	/**
	 * Creates a DeputyContributionSurveySection from a given heading.
	 *
	 * @param casePage
	 * @param heading
	 */
	constructor( casePage: DeputyCasePage, heading: ContributionSurveyHeading ) {
		this.casePage = casePage;
		this.heading = casePage.normalizeSectionHeading( heading );
		this.sectionNodes = casePage.getContributionSurveySection( heading );
	}

	/**
	 * Get the ContributionSurveySection for this section
	 *
	 * @param wikitext Internal use only. Used to skip section loading using existing wikitext.
	 * @return The ContributionSurveySection for this section
	 */
	async getSection( wikitext?: string & { revid: number } ): Promise<ContributionSurveySection> {
		const collapsible = ( this.sectionNodes.find(
			( v: HTMLElement ) => v instanceof HTMLElement && v.querySelector( '.mw-collapsible' )
		) as HTMLElement | null )?.querySelector( '.mw-collapsible' ) ?? null;

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
		let targetSectionNodes = this.sectionNodes;
		let listElements =
			this.sectionNodes.filter(
				( el ) => el instanceof HTMLElement && el.tagName === 'UL'
			) as HTMLUListElement[];

		if ( listElements.length === 0 ) {
			// No list found ! Is this a valid section?
			// Check for a collapsible section.

			const collapsible = ( this.sectionNodes.find(
				( v: HTMLElement ) =>
					v instanceof HTMLElement && v.querySelector( '.mw-collapsible' )
			) as HTMLElement | null )?.querySelector( '.mw-collapsible' ) ?? null;

			if ( collapsible ) {
				// This section has a collapsible. It's possible that it's a closed section.
				// From here, use a different `sectionNodes` (specifically targeting all nodes
				// inside that collapsible), and then locate all ULs inside that collapsible.
				targetSectionNodes = Array.from( collapsible.childNodes );
				listElements = Array.from( collapsible.querySelectorAll( 'ul' ) );
			} else {
				// No collapsible found. Give up.
				console.warn( 'Could not find valid ULs in CCI section.', targetSectionNodes );
				return false;
			}
		}

		const rowElements: Record<string, HTMLLIElement> = {};
		for ( const listElement of listElements ) {
			for ( let i = 0; i < listElement.children.length; i++ ) {
				const li = listElement.children.item( i );
				if ( li.tagName !== 'LI' ) {
					// Skip this element.
					continue;
				}
				const anchor: HTMLElement = li.querySelector( 'a:first-of-type' );
				// Avoid enlisting if the anchor can't be found (invalid row).
				if ( anchor ) {
					rowElements[ new mw.Title( anchor.innerText ).getPrefixedText() ] =
						li as HTMLLIElement;
				}
			}
		}

		const section = await this.getSection();
		const sectionWikitext = section.originalWikitext;
		this.revid = section.revid;

		const wikitextLines = sectionWikitext.split( '\n' );
		this.rows = [];
		this.rowElements = [];
		this.wikitextLines = [];
		let rowElement;
		for ( let i = 0; i < wikitextLines.length; i++ ) {
			const line = wikitextLines[ i ];

			try {
				const csr = new ContributionSurveyRow( this.casePage, line );
				const originalElement = rowElements[ csr.title.getPrefixedText() ];

				if ( originalElement ) {
					rowElement = new DeputyContributionSurveyRow(
						csr, originalElement, line, this
					);
				} else {
					// Element somehow not in list. Just keep line as-is.
					rowElement = line;
				}
			} catch ( e ) {
				// This is not a contribution surveyor row.

				if ( /^\*[^*:]+/.test( line ) ) {
					// Only trigger on actual bulleted lists.
					console.warn( 'Could not parse row.', line, e );
					// For debugging and tests.
					mw.hook( 'deputy.errors.cciRowParse' ).fire( {
						line, error: e.toString()
					} );
				}

				if (
					rowElement instanceof DeputyContributionSurveyRow &&
					rowElement.originalElement.nextSibling == null &&
					rowElement.originalElement.parentNode.nextSibling != null &&
					// Just a blank line. Don't try to do anything else.
					line !== ''
				) {
					// The previous row element was the last in the list. The
					// list probably broke somewhere. (comment with wrong
					// bullet?)
					// In any case, let's try show it anyway. The user might
					// miss some context otherwise.
					// We'll only begin reading proper section data once we hit
					// another bullet. So let's grab all nodes from the erring
					// one until the next bullet list.
					const extraneousNodes = [];
					let lastNode: Node | null =
						rowElement.originalElement.parentElement.nextSibling;
					while (
						// Another node exists next
						lastNode != null &&
						// The node is part of this section
						targetSectionNodes.includes( lastNode ) &&
						(
							// The node is not an element
							!( lastNode instanceof HTMLElement ) ||
							// The element is not a bullet list
							lastNode.tagName !== 'UL'
						)
					) {
						extraneousNodes.push( lastNode );
						lastNode = lastNode.nextSibling;
					}

					rowElement = extraneousNodes;
				} else {
					rowElement = line;
				}
			}
			if ( rowElement instanceof DeputyContributionSurveyRow ) {
				this.rows.push( rowElement );
				this.rowElements.push( rowElement );
				this.wikitextLines.push( rowElement );
			} else if ( Array.isArray( rowElement ) ) {
				// Array of Nodes
				this.wikitextLines.push( line );

				if ( rowElement.length !== 0 ) {
					// Only append the row element if it has contents.
					// Otherwise, there will be a blank blue box.
					this.rowElements.push( DeputyExtraneousElement( rowElement ) );
				}
			} else if ( typeof rowElement === 'string' ) {
				this.wikitextLines.push( rowElement );
			}
		}

		// Hide all section elements
		this.toggleSectionElements( false );

		return true;
	}

	/**
	 * Toggle section elements. Removes the section elements (but preservers them in
	 * `this.sectionElements`) if `false`, re-appends them to the DOM if `true`.
	 * @param toggle
	 */
	toggleSectionElements( toggle: boolean ) {
		const bottom: Node = this.heading.nextSibling ?? null;
		for ( const sectionElement of this.sectionNodes ) {
			if ( toggle ) {
				this.heading.parentNode.insertBefore( sectionElement, bottom );
			} else {
				removeElement( sectionElement );
			}
		}
	}

	/**
	 * Destroys the element from the DOM and re-inserts in its place the original list.
	 * This *should* return the section back to its original look. This does *NOT*
	 * remove the section from the session or cache. Use `DeputySession.closeSection`
	 * instead.
	 */
	close(): void {
		removeElement( this.container );
		this.toggleSectionElements( true );

		// Detach listeners to stop listening to events.
		this.rows.forEach( ( row ) => {
			row.close();
		} );
	}

	/**
	 * Toggles the closing comments input box and signature checkbox.
	 * This will disable the input box AND hide the element from view.
	 *
	 * @param show
	 */
	toggleClosingElements( show: boolean ) {
		this.closingComments.setDisabled( !show );
		this.closingComments.toggle( show );

		this.closingCommentsSign.setDisabled( !show );
		this.closingCommentsSign.toggle( show );
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
		this.closingCommentsSign?.setDisabled( disabled );
		this.rows?.forEach( ( row ) => row.setDisabled( disabled ) );

		this.disabled = disabled;
	}

	/**
	 * Saves the current section to the case page.
	 *
	 * @param sectionId
	 * @return Save data, or `false` if the save hit an error
	 */
	async save( sectionId: number ): Promise<any | false> {
		if ( sectionId == null ) {
			throw new Error( mw.msg( 'deputy.session.section.missingSection' ) );
		}
		if ( this.closed && this.rows.some( r => !r.completed ) ) {
			throw new Error( mw.msg( 'deputy.session.section.sectionIncomplete' ) );
		}

		return MwApi.action.postWithEditToken( {
			...changeTag( await window.deputy.getWikiConfig() ),
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
		// noinspection JSUnresolvedReference
		if ( ( window.deputy as any ).NO_ROW_LOADING !== true ) {
			await Promise.all( this.rows.map( row => row.loadData() ) );
		}
	}

	/**
	 * @inheritDoc
	 */
	render(): HTMLElement {
		this.closingCheckbox = new OO.ui.CheckboxInputWidget( {
			selected: this._section.originallyClosed,
			disabled: this._section.originallyClosed
		} );
		this.closingComments = new OO.ui.TextInputWidget( {
			placeholder: mw.msg( 'deputy.session.section.closeComments' ),
			value: this._section.closingComments,
			disabled: true
		} );
		this.closingCommentsSign = new OO.ui.CheckboxInputWidget( {
			selected: window.deputy.config.cci.signSectionArchive.get(),
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
			await window.deputy.windowManager.openWindow( reviewDialog ).opened;
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
					// Remove whatever section elements are still there.
					// They may have been greatly modified by the save.
					const sectionElements =
						this.casePage.getContributionSurveySection( this.heading );
					sectionElements.forEach( ( el ) => removeElement( el ) );

					// Clear out section elements and re-append new ones to the DOM.
					this.sectionNodes = [];
					// Heading is preserved to avoid messing with IDs.
					const heading = this.heading;
					const insertRef = heading.nextSibling ?? null;
					for ( const child of Array.from( element.childNodes ) ) {
						if ( !this.casePage.isContributionSurveyHeading( child ) ) {
							heading.parentNode.insertBefore( child, insertRef );
							this.sectionNodes.push( child as HTMLElement );
						}
					}

					if ( !this._section.closed ) {
						this._section = null;
						await this.getSection( Object.assign( wikitext, { revid } ) );
						await this.prepare();
						if ( heading.parentElement.classList.contains( 'mw-heading' ) ) {
							// Intentional recursive call
							heading.parentElement.insertAdjacentElement(
								'afterend', this.render()
							);
						} else {
							// Intentional recursive call
							heading.insertAdjacentElement(
								'afterend', this.render()
							);
						}
						// Run this asynchronously.
						setTimeout( this.loadData.bind( this ), 0 );
					}
				}
			}, ( err ) => {
				OO.ui.alert(
					err.message,
					{
						title: mw.msg( 'deputy.session.section.failed' )
					}
				);
				console.error( err );
				saveContainer.classList.remove( 'active' );
				this.setDisabled( false );
			} );

			saveContainer.classList.remove( 'active' );
			this.setDisabled( false );
		} );

		// Section closing (archive/ctop) elements

		const closingWarning = DeputyMessageWidget( {
			classes: [ 'dp-cs-section-unfinishedWarning' ],
			type: 'error',
			label: mw.msg( 'deputy.session.section.closeError' )
		} );
		closingWarning.toggle( false );
		const updateClosingWarning = ( () => {
			const incomplete = this.rows.some( ( row ) => !row.completed );
			this.saveButton.setDisabled( incomplete );
			closingWarning.toggle( incomplete );
		} );

		const closingCommentsField = new OO.ui.FieldLayout( this.closingComments, {
			align: 'top',
			label: mw.msg( 'deputy.session.section.closeComments' ),
			invisibleLabel: true,
			helpInline: true,
			classes: [ 'dp-cs-section-closingCommentsField' ]
		} );

		const closingCommentsSignField = new OO.ui.FieldLayout( this.closingCommentsSign, {
			align: 'inline',
			label: mw.msg( 'deputy.session.section.closeCommentsSign' )
		} );

		const closingFields = <div
			class="dp-cs-section-closing"
			style={{ display: 'none' }}
		>
			{ unwrapWidget( closingCommentsField ) }
			{ unwrapWidget( closingCommentsSignField ) }
		</div>;

		const updateClosingFields = ( v: boolean ) => {
			this.closed = v;

			if ( this._section.originallyClosed ) {
				// This section was originally closed. Hide everything.
				v = false;
			}

			closingFields.style.display = v ? '' : 'none';
			this.toggleClosingElements( v );

			if ( v ) {
				updateClosingWarning();
				this.rows.forEach( ( row ) => {
					row.addEventListener( 'update', updateClosingWarning );
				} );
			} else {
				closingWarning.toggle( false );
				this.saveButton.setDisabled( false );
				this.rows.forEach( ( row ) => {
					row.removeEventListener( 'update', updateClosingWarning );
				} );
			}
		};
		this.closingCheckbox.on( 'change', updateClosingFields );
		updateClosingFields( this.closed );
		this.closingComments.on( 'change', ( v: string ) => {
			this.comments = v;
		} );

		// Actual element

		return this.container = <div class={ classMix(
			'deputy',
			'dp-cs-section',
			this._section.originallyClosed && 'dp-cs-section-archived'
		) }>
			{
				this._section.originallyClosed && <div class="dp-cs-section-archived-warn">
					{
						unwrapWidget( new OO.ui.MessageWidget( {
							type: 'warning',
							label: mw.msg( 'deputy.session.section.closed' )
						} ) )
					}
				</div>
			}
			<div>
				{ this.rowElements.map( ( row ) =>
					row instanceof HTMLElement ? row : row.render()
				) }
			</div>
			<div class="dp-cs-section-footer">
				<div style={{ display: 'flex' }}>
					<div style={{
						flex: '1',
						display: 'flex',
						flexDirection: 'column'
					}}>
						{ unwrapWidget( new OO.ui.FieldLayout( this.closingCheckbox, {
							align: 'inline',
							label: mw.msg( 'deputy.session.section.close' )
						} ) ) }
						{ unwrapWidget( closingWarning ) }
						{ closingFields }
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
