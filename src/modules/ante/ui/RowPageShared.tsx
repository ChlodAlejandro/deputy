import unwrapWidget from '../../../util/unwrapWidget';
import TemplateMerger from '../models/TemplateMerger';
import {
	AttributionNoticeTypeClass,
	SupportedAttributionNoticeType
} from '../models/WikiAttributionNotices';
import { h } from 'tsx-dom';
import AttributionNotice from '../models/AttributionNotice';
import RowedAttributionNotice from '../models/RowedAttributionNotice';

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
	parentTemplate: AttributionNoticeTypeClass<T> & RowedAttributionNotice<any>,
	mergeButton: OO.ui.ButtonWidget
): JSX.Element {
	const mergePanel = new OO.ui.FieldsetLayout( {
		classes: [ 'cte-merge-panel' ],
		icon: 'tableMergeCells',
		label: mw.msg( 'deputy.ante.merge.title' )
	} );
	unwrapWidget( mergePanel ).style.padding = '16px';
	unwrapWidget( mergePanel ).style.zIndex = '20';
	// Hide by default
	mergePanel.toggle( false );

	// <select> and button for merging templates
	const mergeTarget = new OO.ui.DropdownInputWidget( {
		$overlay: true,
		title: mw.msg( 'deputy.ante.merge.from.select' )
	} );
	const mergeTargetButton = new OO.ui.ButtonWidget( {
		label: mw.msg( 'deputy.ante.merge.button' )
	} );
	mergeTargetButton.on( 'click', () => {
		const template = parentTemplate.parsoid.findNoticeType( type ).find(
			( v: AttributionNoticeTypeClass<T> ) => v.name === mergeTarget.getValue()
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
			label: mw.msg( 'deputy.ante.merge.from.label' ),
			align: 'left'
		}
	);
	mergeButton.on( 'click', () => {
		mergePanel.toggle();
	} );
	const mergeAllButton = new OO.ui.ButtonWidget( {
		label: mw.msg( 'deputy.ante.merge.all' ),
		flags: [ 'progressive' ]
	} );
	mergeAllButton.on( 'click', () => {
		const notices = parentTemplate.parsoid.findNoticeType( type );
		// Confirm before merging.
		OO.ui.confirm(
			mw.message(
				'deputy.ante.merge.all.confirm',
				`${notices.length - 1}`
			).text()
		).done( ( confirmed: boolean ) => {
			if ( confirmed ) {
				// Recursively merge all templates
				TemplateMerger.merge(
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
				// * deputy.ante.copied.label
				// * deputy.ante.splitArticle.label
				// * deputy.ante.mergedFrom.label
				// * deputy.ante.mergedTo.label
				// * deputy.ante.backwardsCopy.label
				// * deputy.ante.translatedPage.label
				label: mw.message(
					`deputy.ante.${type}.label`,
					notice.name
				).text()
			} );
		}
		if ( options.length === 0 ) {
			options.push( {
				data: null,
				label: mw.msg( 'deputy.ante.merge.from.empty' ),
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

	// TODO: types-mediawiki limitation
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
			( $( previewPanel ).find( '.mw-collapsible' ) as any )
				.makeCollapsible();
			$( previewPanel ).find( '.collapsible' )
				.each( ( i, e ) => {
					( $( e ) as any ).makeCollapsible( {
						collapsed: e.classList.contains( 'collapsed' )
					} );
				} );
		} );
	}, 1000 );

	// Listen for changes
	template.addEventListener( 'save', () => {
		updatePreview();
	} );
	updatePreview();

	return previewPanel;
}
