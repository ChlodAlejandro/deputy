import unwrapWidget from '../../../util/unwrapWidget';
import TemplateMerger from '../models/TemplateMerger';
import {
	AttributionNoticeTypeClass,
	SupportedAttributionNoticeType
} from '../models/WikiAttributionNotices';
import removeElement from '../../../util/removeElement';
import { h } from 'tsx-dom';
import AttributionNotice from '../models/AttributionNotice';

/**
 * Renders the panel used to merge multiple {{split article}} templates.
 *
 * @param type
 * @param parentTemplate
 * @param mergeButton
 * @return A <div> element
 */
export function renderMergePanel<T extends SupportedAttributionNoticeType>(
	type: T,
	parentTemplate: AttributionNoticeTypeClass<T>,
	mergeButton: any
): JSX.Element {
	const mergePanel = new OO.ui.FieldsetLayout( {
		classes: [ 'cte-merge-panel' ],
		icon: 'tableMergeCells',
		label: mw.message( 'deputy.cte.merge.title' ).text()
	} );
	unwrapWidget( mergePanel ).style.padding = '16px';
	unwrapWidget( mergePanel ).style.zIndex = '20';
	// Hide by default
	mergePanel.toggle( false );

	// <select> and button for merging templates
	const mergeTarget = new OO.ui.DropdownInputWidget( {
		$overlay: true,
		label: mw.message( 'deputy.cte.merge.from.select' ).text()
	} );
	const mergeTargetButton = new OO.ui.ButtonWidget( {
		label: mw.message( 'deputy.cte.merge.button' ).text()
	} );
	mergeTargetButton.on( 'click', () => {
		const template = parentTemplate.parsoid.findNoticeType( type ).find(
			( v: AttributionNoticeTypeClass<T> ) => v.name === mergeTarget.value
		);
		if ( template ) {
			// If template found, merge and reset panel
			parentTemplate.merge( template as any, { delete: true } );
			mergeTarget.setValue( null );
			mergePanel.toggle( false );
		}
	} );

	const mergeFieldLayout = new OO.ui.ActionFieldLayout(
		mergeTarget,
		mergeTargetButton,
		{
			label: mw.message( 'deputy.cte.merge.from.label' ).text(),
			align: 'left'
		}
	);
	mergeButton.on( 'click', () => {
		mergePanel.toggle();
	} );
	const mergeAllButton = new OO.ui.ButtonWidget( {
		label: mw.message( 'deputy.cte.merge.all' ).text(),
		flags: [ 'progressive' ]
	} );
	mergeAllButton.on( 'click', () => {
		const notices = parentTemplate.parsoid.findNoticeType( type );
		// Confirm before merging.
		OO.ui.confirm(
			mw.message(
				'deputy.cte.merge.all.confirm',
				`${notices.length - 1}`
			).text()
		).done( ( confirmed: boolean ) => {
			if ( confirmed ) {
				// Recursively merge all templates
				TemplateMerger.copied(
					notices as any,
					parentTemplate as any
				);
				mergeTarget.setValue( null );
				mergePanel.toggle( false );
			}
		} );
	} );

	const recalculateOptions = () => {
		const notices = parentTemplate.parsoid.findNoticeType( type );
		const options = [];
		for ( const notice of notices ) {
			if ( notice === parentTemplate ) {
				continue;
			}
			options.push( {
				data: notice.name,
				// Messages used here:
				// * deputy.cte.copied.label
				// * deputy.cte.splitArticle.label
				// * deputy.cte.mergedFrom.label
				// * deputy.cte.mergedTo.label
				// * deputy.cte.backwardsCopy.label
				// * deputy.cte.translatedPage.label
				label: mw.message(
					`deputy.cte.${type}.label`,
					notice.name
				).text()
			} );
		}
		if ( options.length === 0 ) {
			options.push( {
				data: null,
				label: mw.message( 'deputy.cte.merge.from.empty' ).text(),
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
 * Renders the preview "panel". Not an actual panel, but rather a <div> that
 * shows a preview of the template to be saved. Automatically updates on
 * template changes.
 *
 * @param template The notice to generate previews for and listen events on.
 * @return A preview panel that automatically updates based on the provided notice.
 */
export function renderPreviewPanel( template: AttributionNotice ): JSX.Element {
	const previewPanel = <div class="cte-preview" /> as HTMLElement;

	const updatePreview = ( mw.util as any ).throttle( async (): Promise<void> => {
		if ( !previewPanel ) {
			// Skip if still unavailable.
			return;
		}

		await template.generatePreview().then( ( data: string ) => {
			previewPanel.innerHTML = data;

			// Make all anchor links open in a new tab (prevents exit navigation)
			previewPanel.querySelectorAll( 'a' )
				.forEach( ( el: HTMLElement ) => {
					el.setAttribute( 'target', '_blank' );
					el.setAttribute( 'rel', 'noopener' );
				} );

			// Infuse collapsibles
			( $( previewPanel ).find( '.collapsible, .mw-collapsible' ) as any )
				.makeCollapsible();
		} );
	}, 1000 );

	// Listen for changes
	template.addEventListener( 'save', () => {
		updatePreview();
	} );
	updatePreview();

	return previewPanel;
}
