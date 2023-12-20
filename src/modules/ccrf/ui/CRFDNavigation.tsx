import CaseRequestFilingDialog from './CaseRequestFilingDialog';
import unwrapWidget from '../../../util/unwrapWidget';
import { h } from 'tsx-dom';
import { PromiseOrNot } from '../../../types';

interface CRFDNavigationOptions {
	dialog: ReturnType<typeof CaseRequestFilingDialog>;
	page: { name: string };
	previousButton?: JSX.Element;
	nextButton?: JSX.Element;
	preNext?: () => PromiseOrNot<boolean>;
	prePrevious?: () => PromiseOrNot<boolean>;
}

/**
 *
 * @param root0
 * @param root0.dialog
 * @param root0.prePrevious
 * @return An OOUI ButtonWidget
 */
export function getCRFDNavigationPreviousButton( { dialog, prePrevious }: CRFDNavigationOptions ):
	any {
	const previousPageButton = new OO.ui.ButtonWidget( {
		invisibleLabel: true,
		label: mw.msg( 'deputy.ccrf.previous' ),
		icon: 'previous',
		classes: [ 'page-navigation--previous' ]
	} );
	previousPageButton.on( 'click', async () => {
		if ( prePrevious ) {
			previousPageButton.setDisabled( true );
			const willNavigate = await prePrevious();
			previousPageButton.setDisabled( false );
			if ( willNavigate ) {
				dialog.previousPage();
			}
		} else {
			dialog.previousPage();
		}
	} );

	return previousPageButton;
}

/**
 *
 * @param root0
 * @param root0.dialog
 * @param root0.preNext
 * @return An OOUI ButtonWidget
 */
export function getCRFDNavigationNextButton( { dialog, preNext }: CRFDNavigationOptions ):
	any {
	const nextPageButton = new OO.ui.ButtonWidget( {
		invisibleLabel: true,
		label: mw.msg( 'deputy.ccrf.next' ),
		icon: 'next',
		flags: [ 'primary', 'progressive' ],
		classes: [ 'page-navigation--next' ]
	} );
	nextPageButton.on( 'click', async () => {
		if ( preNext ) {
			nextPageButton.setDisabled( true );
			const willNavigate = await preNext();
			nextPageButton.setDisabled( false );
			if ( willNavigate ) {
				dialog.nextPage();
			}
		} else {
			dialog.nextPage();
		}
	} );

	return nextPageButton;
}

// noinspection JSCommentMatchesSignature
/**
 * Renders the navigation bar (previous/next buttons) for dialog pages.
 *
 * @param options
 * @param options.dialog The case request filing dialog
 * @param options.page The page to render the navigation bar for
 * @param options.page.name The name of the page (should be constant)
 * @param options.previousButton
 * @param options.nextButton
 * @param options.preNext A function to call before navigating to the next page.
 *     If this returns `false`, the navigation is cancelled. Ignored if `nextButton` is
 *     provided.
 * @return A JSX Element
 */
export default function (
	options : CRFDNavigationOptions
) {
	const { dialog, page, previousButton, nextButton } = options;
	const isFirst = dialog.isFirstPage( page.name );
	const isLast = dialog.isLastPage( page.name );

	return <div class="page-navigation">
		{previousButton ?? ( !isFirst &&
			unwrapWidget( getCRFDNavigationPreviousButton( options ) ) )}
		{nextButton ?? ( !isLast &&
			unwrapWidget( getCRFDNavigationNextButton( options ) ) )}
	</div>;
}
