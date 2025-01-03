import { h } from 'tsx-dom';
import '../../../types';
import unwrapWidget from '../../../util/unwrapWidget';
import type CopyrightProblemsListing from '../models/CopyrightProblemsListing';
import removeElement from '../../../util/removeElement';
import renderWikitext from '../../../wiki/util/renderWikitext';
import { CopyrightProblemsResponse } from '../models/CopyrightProblemsResponse';
import error from '../../../util/error';

/**
 *
 */
export default class ListingResponsePanel extends EventTarget {

	/**
	 * @return A set of possible copyright problems responses.
	 */
	static get responses(): CopyrightProblemsResponse[] {
		return window.InfringementAssistant.wikiConfig.ia.responses.get();
	}

	/**
	 * @param response
	 * @param locale
	 * @return The given response for the given locale
	 */
	static getResponseLabel( response: CopyrightProblemsResponse, locale?: string ) {
		if ( !locale ) {
			locale = window.deputyLang ?? mw.config.get( 'wgUserLanguage' );
		}
		const locale1 = locale.replace( /-.*$/g, '' );

		return typeof response.label === 'string' ?
			response.label :
			( response.label[ locale ] ?? response.label[ locale1 ] ?? response.label[ 0 ] );
	}

	originLink: HTMLElement;
	listing: CopyrightProblemsListing;
	element: HTMLElement;

	dropdown: OO.ui.DropdownInputWidget;
	commentsField: OO.ui.MultilineTextInputWidget;
	previewPanel: HTMLElement;
	submitButton: OO.ui.ButtonWidget;

	prefill: CopyrightProblemsResponse;
	comments: string;

	// TODO: types-mediawiki limitation
	readonly reloadPreviewThrottled = ( mw.util as any ).throttle( this.reloadPreview, 500 );

	/**
	 * @param originLink
	 * @param listing
	 */
	constructor( originLink: HTMLElement, listing: CopyrightProblemsListing ) {
		super();
		this.originLink = originLink;
		this.listing = listing;
	}

	/**
	 * @return The edit summary for this edit.
	 */
	getEditSummary(): string {
		return this.prefill?.closing === false ? mw.msg(
			'deputy.ia.content.respond',
			this.listing.listingPage.title.getPrefixedText(),
			this.listing.title.getPrefixedText()
		) : mw.msg(
			'deputy.ia.content.close',
			this.listing.listingPage.title.getPrefixedText(),
			this.listing.title.getPrefixedText()
		);
	}

	/**
	 * Renders the response dropdown.
	 *
	 * @return An unwrapped OOUI DropdownInputWidget.
	 */
	renderPrefillDropdown(): JSX.Element {
		const options: OO.ui.DropdownInputWidget.Option[] = [ {
			data: null,
			label: mw.msg( 'deputy.ia.listing.re.label' ),
			disabled: true
		} ];
		for ( const responseId in ListingResponsePanel.responses ) {
			const response = ListingResponsePanel.responses[ responseId ];
			options.push( {
				data: `${responseId}`,
				label: ListingResponsePanel.getResponseLabel( response )
			} );
		}

		this.dropdown = new OO.ui.DropdownInputWidget( {
			options,
			dropdown: {
				label: mw.msg( 'deputy.ia.listing.re.label' ),
				title: mw.msg( 'deputy.ia.listing.re.title' )
			}
		} );

		this.dropdown.on( 'change', ( value: string ) => {
			this.prefill = ListingResponsePanel.responses[ +value ];
			this.reloadPreviewThrottled();
		} );

		return unwrapWidget( this.dropdown );
	}

	/**
	 * @return An unwrapped OOUI TextInputWidget
	 */
	renderAdditionalCommentsField(): JSX.Element {
		this.commentsField = new OO.ui.MultilineTextInputWidget( {
			placeholder: mw.msg( 'deputy.ia.listing.re.extras' ),
			autosize: true,
			rows: 1
		} );

		this.commentsField.on( 'change', ( text: string ) => {
			this.comments = text;
			this.reloadPreviewThrottled();
		} );

		return unwrapWidget( this.commentsField );
	}

	/**
	 * @return An unwrapped OOUI ButtonWidget.
	 */
	renderCloseButton(): JSX.Element {
		const closeButton = new OO.ui.ButtonWidget( {
			flags: [ 'destructive' ],
			label: mw.msg( 'deputy.ia.listing.re.close' ),
			framed: true
		} );

		closeButton.on( 'click', () => {
			this.close();
		} );

		return unwrapWidget( closeButton );
	}

	/**
	 * @return An unwrapped OOUI ButtonWidget.
	 */
	renderSubmitButton(): JSX.Element {
		this.submitButton = new OO.ui.ButtonWidget( {
			flags: [ 'progressive', 'primary' ],
			label: mw.msg( 'deputy.ia.listing.re.submit' ),
			disabled: true
		} );

		this.submitButton.on( 'click', async () => {
			this.dropdown.setDisabled( true );
			this.commentsField.setDisabled( true );
			this.submitButton.setDisabled( true );

			try {
				await this.listing.respond(
					this.toWikitext(),
					this.getEditSummary(),
					false
				);
				const dd = <dd dangerouslySetInnerHTML={this.previewPanel.innerHTML} />;
				dd.querySelectorAll( '.deputy' )
					.forEach( ( v : HTMLElement ) => removeElement( v ) );

				// Try to insert at an existing list for better spacing.
				if ( this.element.previousElementSibling.tagName === 'DL' ) {
					this.element.previousElementSibling.appendChild( dd );
				} else {
					this.element.insertAdjacentElement(
						'afterend',
						<dl class="ia-newResponse">{dd}</dl>
					);
				}

				this.close();
				mw.notify( mw.msg( 'deputy.ia.listing.re.published' ), {
					type: 'success'
				} );
			} catch ( e ) {
				error( e );
				OO.ui.alert( mw.msg( 'deputy.ia.listing.re.error', e.message ) );

				this.dropdown.setDisabled( false );
				this.commentsField.setDisabled( false );
				this.submitButton.setDisabled( false );
			}
		} );

		return unwrapWidget( this.submitButton );
	}

	/**
	 * Reloads the preview.
	 */
	reloadPreview() {
		const wikitext = this.toWikitext();
		if ( wikitext == null ) {
			this.previewPanel.style.display = 'none';
		} else {
			this.previewPanel.style.display = '';
		}

		renderWikitext(
			wikitext,
			this.listing.listingPage.title.getPrefixedText(),
			{
				pst: true,
				summary: this.getEditSummary()
			}
		).then( ( data ) => {
			this.previewPanel.innerHTML = data;
			const cpcContent = this.previewPanel.querySelector(
				'ul > li > dl > dd'
			);
			if ( cpcContent ) {
				// Extract ONLY the actual text.
				this.previewPanel.innerHTML = cpcContent.innerHTML;
			}

			// Infuse collapsibles
			( $( this.previewPanel ).find( '.mw-collapsible' ) as any )
				.makeCollapsible?.();
			$( this.previewPanel ).find( '.collapsible' )
				.each( ( i, e ) => {
					( $( e ) as any ).makeCollapsible?.( {
						collapsed: e.classList.contains( 'collapsed' )
					} );
				} );

			// Add in "summary" row.
			this.previewPanel.insertAdjacentElement(
				'afterbegin',
				<div class="deputy" style={ {
					fontSize: '0.9em',
					borderBottom: '1px solid #c6c6c6',
					marginBottom: '0.5em',
					paddingBottom: '0.5em'
				} }>
					Summary: <i>(<span
						class="mw-content-text"
						dangerouslySetInnerHTML={ data.summary }
					/>)</i>
				</div>
			);

			// Make all anchor links open in a new tab (prevents exit navigation)
			this.previewPanel.querySelectorAll( 'a' )
				.forEach( ( el: HTMLElement ) => {
					if ( el.hasAttribute( 'href' ) ) {
						el.setAttribute( 'target', '_blank' );
						el.setAttribute( 'rel', 'noopener' );
					}
				} );
		} );
	}

	/**
	 * @return A wikitext representation of the response generated by this panel.
	 */
	toWikitext(): string {
		if ( this.prefill == null && this.comments == null ) {
			this.submitButton?.setDisabled( true );
			return null;
		} else {
			this.submitButton?.setDisabled( false );
		}

		return this.prefill ?
			mw.format(
				this.prefill.template,
				this.listing.title.getPrefixedText(),
				this.comments ?? ''
			) :
			this.comments;
	}

	/**
	 * @return The listing panel
	 */
	render(): JSX.Element {
		return this.element = <div class="ia-listing-response">
			<div class="ia-listing-response--dropdown">{
				this.renderPrefillDropdown()
			}</div>
			<div class="ia-listing-response--comments">{
				this.renderAdditionalCommentsField()
			}</div>
			{ this.previewPanel = <div
				class="ia-listing--preview"
				data-label={mw.msg( 'deputy.ia.listing.re.preview' )}
				style={'display: none'}
			></div> as HTMLElement }
			<div class="ia-listing-response--submit">
				{ this.renderCloseButton() }
				{ this.renderSubmitButton() }
			</div>
		</div> as HTMLElement;
	}

	/**
	 * Announce closure of this panel and remove it from the DOM.
	 */
	close() {
		this.dispatchEvent( new Event( 'close' ) );
		removeElement( this.element );
	}

}
