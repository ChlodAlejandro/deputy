import { h } from 'tsx-dom';
import unwrapWidget from '../../../util/unwrapWidget';
import SinglePageWorkflowDialog from './SinglePageWorkflowDialog';
import openWindow from '../../../wiki/util/openWindow';
import removeElement from '../../../util/removeElement';
import renderWikitext from '../../../wiki/util/renderWikitext';
import CopyrightProblemsPage from '../models/CopyrightProblemsPage';
import delink from '../../../wiki/util/delink';
import getObjectValues from '../../../util/getObjectValues';
import { CompletionAction } from '../../shared/CompletionAction';
import purge from '../../../wiki/util/purge';
import { blockExit, unblockExit } from '../../../util/blockExit';
import CCICaseInputWidget from './CCICaseInputWidget';
import msgEval from '../../../wiki/util/msgEval';
import MwApi from '../../../MwApi';
import decorateEditSummary from '../../../wiki/util/decorateEditSummary';
import changeTag from '../../../config/changeTag';
import CheckboxInputWidget = OO.ui.CheckboxInputWidget;
import log from '../../../util/log';

/**
 * @param props
 * @param props.button
 * @return A panel for opening a single page workflow dialog
 */
function NewCopyrightProblemsListingPanel( props: {
	button: OO.ui.ButtonWidget
} ): JSX.Element {
	const titleSearch = new mw.widgets.TitleInputWidget( {
		required: true,
		showMissing: false,
		validateTitle: true,
		excludeDynamicNamespaces: true
	} );
	const cancelButton = new OO.ui.ButtonWidget( {
		classes: [ 'ia-listing-new--cancel' ],
		label: mw.msg( 'deputy.cancel' ),
		flags: [ 'destructive' ]
	} );
	const openButton = new OO.ui.ButtonWidget( {
		label: mw.msg( 'deputy.ia.listing.new.report' ),
		flags: [ 'progressive' ]
	} );

	const field = new OO.ui.ActionFieldLayout(
		titleSearch,
		openButton,
		{
			classes: [ 'ia-listing-new--field' ],
			align: 'top',
			label: mw.msg( 'deputy.ia.listing.new.page.label' )
		}
	);

	const el = <div class="ia-listing-new">
		{ unwrapWidget( field ) }
		{ unwrapWidget( cancelButton ) }
	</div>;

	openButton.on( 'click', () => {
		if ( titleSearch.isQueryValid() ) {
			mw.loader.using( window.InfringementAssistant.static.dependencies, async () => {
				props.button.setDisabled( false );
				removeElement( el as HTMLElement );
				const spwd = SinglePageWorkflowDialog( {
					page: titleSearch.getMWTitle(),
					shadow: false
				} );
				await openWindow( spwd );
			} );
		}
	} );

	cancelButton.on( 'click', () => {
		props.button.setDisabled( false );
		removeElement( el as HTMLElement );
	} );

	return el;
}

/**
 * @param props
 * @param props.button
 * @return A panel for reporting multiple pages
 */
function NewCopyrightProblemsBatchListingPanel( props: {
	button: OO.ui.ButtonWidget
} ) {
	blockExit( 'ia-ncpbl' );
	const cancelButton = new OO.ui.ButtonWidget( {
		label: mw.msg( 'deputy.cancel' ),
		flags: [ 'destructive' ]
	} );
	const openButton = new OO.ui.ButtonWidget( {
		label: mw.msg( 'deputy.ia.listing.new.report' ),
		flags: [ 'progressive', 'primary' ]
	} );

	const inputs = {
		title: new OO.ui.TextInputWidget( {
			required: true,
			placeholder: mw.msg( 'deputy.ia.listing.new.title.placeholder' )
		} ),
		titleMultiselect: new mw.widgets.TitlesMultiselectWidget( {
			inputPosition: 'outline',
			allowArbitrary: false,
			required: true,
			showMissing: false,
			validateTitle: true,
			excludeDynamicNamespaces: true
		} ),
		presumptive: new OO.ui.CheckboxInputWidget( {
			selected: false
		} ),
		presumptiveCase: CCICaseInputWidget( {
			allowArbitrary: false,
			required: true,
			showMissing: false,
			validateTitle: true,
			excludeDynamicNamespaces: true
		} ),
		fromUrls: new OO.ui.CheckboxInputWidget( {
			selected: window.InfringementAssistant.config.ia.defaultFromUrls.get()
		} ),
		sourceUrls: new OO.ui.TagMultiselectWidget( {
			allowArbitrary: true,
			inputPosition: 'outline',
			indicator: 'required',
			placeholder: mw.msg( 'deputy.ia.report.sourceUrls.placeholder' )
		} ),
		sourceText: new OO.ui.MultilineTextInputWidget( {
			autosize: true,
			maxRows: 2,
			indicator: 'required',
			placeholder: mw.msg( 'deputy.ia.report.sourceText.placeholder' )
		} ),
		comments: new OO.ui.TextInputWidget( {
			placeholder: mw.msg( 'deputy.ia.listing.new.comments.placeholder' )
		} ),
		massBlank: new OO.ui.CheckboxInputWidget( {
			selected: true
		} )
	};
	inputs.presumptiveCase.setValidation(
		( value: string ) =>
			!inputs.presumptive.isSelected() ||
			value.trim().length > 0
	);
	inputs.sourceText.setValidation(
		( value: string ) =>
			inputs.presumptive.isSelected() ||
			inputs.fromUrls.isSelected() ||
			value.trim().length > 0
	);
	const field = {
		title: new OO.ui.FieldLayout(
			inputs.title,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.listing.new.title.label' )
			}
		),
		titleSearch: new OO.ui.FieldLayout(
			inputs.titleMultiselect,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.listing.new.pages.label' )
			}
		),
		comments: new OO.ui.FieldLayout(
			inputs.comments,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.listing.new.comments.label' )
			}
		),
		presumptive: new OO.ui.FieldLayout(
			inputs.presumptive,
			{
				align: 'inline',
				label: mw.msg( 'deputy.ia.listing.new.presumptive.label' ),
				help: mw.msg( 'deputy.ia.listing.new.presumptive.help' )
			}
		),
		presumptiveCase: new OO.ui.FieldLayout(
			inputs.presumptiveCase,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.listing.new.presumptiveCase.label' ),
				help: mw.msg( 'deputy.ia.listing.new.presumptiveCase.help' )
			}
		),
		fromUrls: new OO.ui.FieldLayout(
			inputs.fromUrls,
			{
				align: 'inline',
				label: mw.msg( 'deputy.ia.report.fromUrls.label' ),
				help: mw.msg( 'deputy.ia.report.fromUrls.help' )
			}
		),
		sourceUrls: new OO.ui.FieldLayout(
			inputs.sourceUrls,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.report.source.label' )
			}
		),
		sourceText: new OO.ui.FieldLayout(
			inputs.sourceText,
			{
				align: 'top',
				label: mw.msg( 'deputy.ia.report.source.label' )
			}
		),
		massBlank: new OO.ui.FieldLayout(
			inputs.massBlank,
			{
				align: 'inline',
				label: mw.msg( 'deputy.ia.listing.new.massBlank.label' ),
				help: mw.msg( 'deputy.ia.listing.new.massBlank.help' ),
				helpInline: true
			}
		)
	};

	/**
	 *
	 */
	function getComment() {
		const sourceUrls = inputs.sourceUrls.getValue();
		return inputs.presumptive.isSelected() ?
			mw.msg(
				'deputy.ia.content.batchListingComment.pd',
				window.InfringementAssistant.wikiConfig
					.cci.rootPage.get().getPrefixedText(),
				inputs.presumptiveCase.getValue(),
				inputs.comments.getValue()
			) :
			mw.msg(
				'deputy.ia.content.batchListingComment',
				inputs.fromUrls.isSelected() ?
					sourceUrls
						.map( ( v ) => `[${v}]` )
						.join(
							sourceUrls.length > 2 ?
								mw.msg( 'deputy.comma-separator' ) :
								' '
						) :
					inputs.sourceText.getValue(),
				inputs.comments.getValue()
			);
	}

	const getData = ( listingPage: CopyrightProblemsPage ) => {
		return {
			wikitext: listingPage.getBatchListingWikitext(
				inputs.titleMultiselect.items.map(
					( v : {data: string} ) => new mw.Title( v.data )
				),
				inputs.title.getValue(),
				getComment()
			),
			summary: mw.msg(
				inputs.presumptive.getValue() ?
					'deputy.ia.content.batchListing.pd' :
					'deputy.ia.content.batchListing',
				listingPage.title.getPrefixedText(),
				delink( inputs.title.getValue() )
			)
		};
	};

	const currentListingPage = CopyrightProblemsPage.getCurrent();

	const previewPanel = <div
		class="ia-listing--preview"
		data-label={mw.msg( 'deputy.ia.listing.new.preview' )}
	/>;
	// TODO: types-mediawiki limitation
	const reloadPreview = ( mw.util as any ).throttle( async () => {
		const data = getData( currentListingPage );
		await renderWikitext(
			data.wikitext,
			currentListingPage.title.getPrefixedText(),
			{
				pst: true,
				summary: data.summary
			}
		).then( ( renderedWikitext ) => {
			previewPanel.innerHTML = renderedWikitext;

			// Infuse collapsibles
			( $( previewPanel ).find( '.mw-collapsible' ) as any )
				.makeCollapsible?.();
			$( previewPanel ).find( '.collapsible' )
				.each( ( i, e ) => {
					( $( e ) as any ).makeCollapsible?.( {
						collapsed: e.classList.contains( 'collapsed' )
					} );
				} );

			// Add in "summary" row.
			previewPanel.insertAdjacentElement(
				'afterbegin',
				<div class="deputy" style={ {
					fontSize: '0.9em',
					borderBottom: '1px solid #c6c6c6',
					marginBottom: '0.5em',
					paddingBottom: '0.5em'
				} }>
					Summary: <i>(<span
						class="mw-content-text"
						dangerouslySetInnerHTML={ renderedWikitext.summary }
					/>)</i>
				</div>
			);

			// Make all anchor links open in a new tab (prevents exit navigation)
			previewPanel.querySelectorAll( 'a' )
				.forEach( ( el: HTMLElement ) => {
					if ( el.hasAttribute( 'href' ) ) {
						el.setAttribute( 'target', '_blank' );
						el.setAttribute( 'rel', 'noopener' );
					}
				} );
		} );
	}, 500 );

	getObjectValues( inputs ).forEach( ( a: OO.EventEmitter ) => {
		a.on( 'change', reloadPreview );
	} );

	const el = <div class="ia-batchListing-new">
		{ unwrapWidget( field.titleSearch ) }
		{ unwrapWidget( field.title ) }
		{ unwrapWidget( field.presumptive ) }
		{ unwrapWidget( field.presumptiveCase ) }
		{ unwrapWidget( field.fromUrls ) }
		{ unwrapWidget( field.sourceUrls ) }
		{ unwrapWidget( field.sourceText ) }
		{ unwrapWidget( field.comments ) }
		{ unwrapWidget( field.massBlank ) }
		{ previewPanel }
		<div class="ia-batchListing-new--buttons">
			{ unwrapWidget( cancelButton ) }
			{ unwrapWidget( openButton ) }
		</div>
	</div>;

	let disabled = false;
	const setDisabled = ( _disabled = !disabled ) => {
		cancelButton.setDisabled( _disabled );
		openButton.setDisabled( _disabled );
		inputs.title.setDisabled( _disabled );
		inputs.titleMultiselect.setDisabled( _disabled );
		inputs.comments.setDisabled( _disabled );
		inputs.presumptive.setDisabled( _disabled );
		inputs.presumptiveCase.setDisabled( _disabled );
		inputs.fromUrls.setDisabled( _disabled );
		inputs.sourceUrls.setDisabled( _disabled );
		inputs.sourceText.setDisabled( _disabled );
		inputs.massBlank.setDisabled( _disabled );
		disabled = _disabled;
	};

	/**
	 * @param selected
	 */
	function handlePresumptive( selected: boolean ) {
		field.presumptiveCase.toggle( selected );
		field.fromUrls.toggle( !selected );
		if ( inputs.fromUrls.isSelected() ) {
			field.sourceUrls.toggle( !selected );
			field.sourceText.toggle( false );
		} else {
			field.sourceUrls.toggle( false );
			field.sourceText.toggle( !selected );
		}
	}

	/**
	 * @param selected
	 */
	function handleFromUrls( selected: boolean ) {
		if ( inputs.presumptive.isSelected() ) {
			// Ignore if presumptive is selected
			return;
		}
		field.sourceUrls.toggle( selected );
		field.sourceText.toggle( !selected );
	}

	inputs.presumptive.on( 'change', handlePresumptive );
	inputs.fromUrls.on( 'change', handleFromUrls );
	handlePresumptive( inputs.presumptive.isSelected() );
	handleFromUrls( inputs.fromUrls.isSelected() );

	const urlsValid = () => {
		const values = inputs.sourceUrls.getValue();
		return values.length > 0 &&
			values.every( v => typeof v === 'string' && v.trim().length > 0 );
	};

	/**
	 * Validate input fields
	 */
	function validateInputs() {
		inputs.presumptiveCase.setValidityFlag();
		inputs.sourceText.setValidityFlag();
		inputs.sourceUrls.toggleValid(
			inputs.presumptive.isSelected() ||
			!inputs.fromUrls.isSelected() ||
			urlsValid()
		);
	}

	inputs.presumptive.on( 'change', validateInputs );
	inputs.presumptiveCase.on( 'change', validateInputs );
	inputs.fromUrls.on( 'change', validateInputs );
	inputs.sourceUrls.on( 'change', validateInputs );
	inputs.sourceText.on( 'change', validateInputs );

	openButton.on( 'click', async () => {
		validateInputs();
		setDisabled( true );
		await reloadPreview();
		if (
			inputs.titleMultiselect.items.length > 0 &&
			( inputs.title.getValue() as string || '' ).trim().length > 0 &&
			inputs.presumptiveCase.getValidity() &&
			inputs.sourceUrls.checkValidity() &&
			inputs.sourceText.getValidity()
		) {
			await currentListingPage.postListings(
				inputs.titleMultiselect.items.map(
					( v : {data: string} ) => new mw.Title( v.data )
				),
				inputs.title.getValue(),
				getComment()
			).then( async () => {
				if ( !inputs.massBlank.isSelected() ) {
					return;
				}
				const wikiConfig = window.InfringementAssistant.wikiConfig.ia;
				const copyvioTop = msgEval(
					wikiConfig.hideTemplate.get(),
					{
						presumptive: inputs.presumptive.isSelected() ? 'true' : '',
						presumptiveCase: inputs.presumptiveCase.getValue() ? 'true' : '',
						fromUrls: inputs.fromUrls.isSelected() ? 'true' : '',
						sourceUrls: urlsValid() ? 'true' : '',
						sourceText: inputs.sourceText.getValue() ? 'true' : '',
						entirePage: 'true'
					},
					inputs.presumptive.isSelected() ?
						`[[${
							window.InfringementAssistant.wikiConfig.cci
								.rootPage.get().getPrefixedText()
						}/${inputs.presumptiveCase.getValue()}]]` : (
							inputs.fromUrls.isSelected() ?
								inputs.sourceUrls.getValue().join( ' ' ) :
								inputs.sourceText.getValue()
						),
					'true'
				).text() + '\n';

				let copyvioBottom = '';
				if ( wikiConfig.entirePageAppendBottom.get() ) {
					copyvioBottom = '\n' + wikiConfig.hideTemplateBottom.get();
				}

				for ( const index in inputs.titleMultiselect.items ) {
					const titleItem = inputs.titleMultiselect.items[ index ];
					const title = new mw.Title( titleItem.data );
					mw.notify( mw.msg(
						'deputy.ia.listing.new.blanking',
						title.getPrefixedText(),
						( +index ) + 1,
						inputs.titleMultiselect.items.length
					) );
					await MwApi.action.postWithEditToken( {
						...changeTag( await window.InfringementAssistant.getWikiConfig() ),
						action: 'edit',
						title: title.getPrefixedText(),
						prependtext: copyvioTop,
						appendtext: copyvioBottom,
						summary: decorateEditSummary(
							mw.msg(
								'deputy.ia.content.batchBlanking',
								currentListingPage.title.getPrefixedText(),
								inputs.title.getValue()
							),
							window.InfringementAssistant.config
						)
					} ).catch( ( e ) => {
						mw.notify( mw.message(
							'deputy.ia.listing.new.blanking.failed',
							title.getPrefixedText(),
							e.message
						).parseDom(), {
							type: 'error'
						} );
					} );
				}

			} ).then( async () => {
				await purge( currentListingPage.title ).catch( () => { /* ignored */ } );
				mw.notify( mw.msg( 'deputy.ia.listing.new.batchListed' ), {
					type: 'success'
				} );
				unblockExit( 'ia-ncpbl' );
				removeElement( el as HTMLElement );
				props.button.setDisabled( false );

				switch ( window.InfringementAssistant.config.ia.onBatchSubmit.get() ) {
					case CompletionAction.Nothing:
						break;
					default:
						window.location.reload();
				}
			}, ( e ) => {
				mw.notify( mw.msg(
					'deputy.ia.listing.new.batchError',
					e.message
				), {
					type: 'error'
				} );
				setDisabled( false );
			} );
		} else {
			setDisabled( false );
		}
	} );

	cancelButton.on( 'click', () => {
		props.button.setDisabled( false );
		unblockExit( 'ia-ncpbl' );
		removeElement( el as HTMLElement );
	} );

	return el;
}

/**
 * @return The HTML button set and panel container
 */
export default function NewCopyrightProblemsListing(): JSX.Element {
	const root = <div class="deputy ia-listing-newPanel"/>;

	const addListingButton = new OO.ui.ButtonWidget( {
		icon: 'add',
		label: mw.msg( 'deputy.ia.listing.new' ),
		flags: 'progressive'
	} );
	const addBatchListingButton = new OO.ui.ButtonWidget( {
		icon: 'add',
		label: mw.msg( 'deputy.ia.listing.new.batch' ),
		flags: 'progressive'
	} );

	addListingButton.on( 'click', () => {
		addListingButton.setDisabled( true );
		root.appendChild( <NewCopyrightProblemsListingPanel button={addListingButton} /> );
	} );

	addBatchListingButton.on( 'click', () => {
		addBatchListingButton.setDisabled( true );
		root.appendChild(
			<NewCopyrightProblemsBatchListingPanel button={addBatchListingButton} />
		);
	} );

	root.appendChild( unwrapWidget( addListingButton ) );
	root.appendChild( unwrapWidget( addBatchListingButton ) );
	return root;
}
