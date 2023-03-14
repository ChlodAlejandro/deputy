import CaseRequestFilingDialog from './CaseRequestFilingDialog';
import unwrapWidget from '../../../util/unwrapWidget';
import { h } from 'tsx-dom';
import { PromiseOrNot } from '../../../types';

// noinspection JSCommentMatchesSignature
/**
 * Renders the navigation bar (previous/next buttons) for dialog pages.
 *
 * @param root0
 * @param root0.dialog The case request filing dialog
 * @param root0.page The page to render the navigation bar for
 * @param root0.page.name The name of the page (should be constant)
 * @param root0.previousButton
 * @param root0.nextButton
 * @param root0.preNext A function to call before navigating to the next page.
 *     If this returns `false`, the navigation is cancelled. Ignored if `nextButton` is
 *     provided.
 * @return A JSX Element
 */
export default function (
	{ dialog, page, previousButton, nextButton, preNext } : {
		dialog: ReturnType<typeof CaseRequestFilingDialog>,
		page: { name: string },
		previousButton?: JSX.Element,
		nextButton?: JSX.Element,
		preNext?: () => PromiseOrNot<boolean>
	}
) {
	const isFirst = dialog.isFirstPage( page.name );
	const isLast = dialog.isLastPage( page.name );

	return <div class="page-navigation">
		{previousButton ?? ( !isFirst && ( () => {
			const previousPageButton = new OO.ui.ButtonWidget( {
				invisibleLabel: true,
				label: mw.msg( 'deputy.ccrf.previous' ),
				icon: 'previous',
				classes: [ 'page-navigation--previous' ]
			} );
			previousPageButton.on( 'click', () => {
				dialog.previousPage();
			} );

			return unwrapWidget( previousPageButton );
		} )() )}
		{nextButton ?? ( !isLast && ( () => {
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

			return unwrapWidget( nextPageButton );
		} )() )}
	</div>;
}
