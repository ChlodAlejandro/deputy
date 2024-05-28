import { h } from 'tsx-dom';
import '../../../../types';
import msgEval from '../../../../wiki/util/msgEval';
import type CaseRequestFilingDialog from '../CaseRequestFilingDialog';
import CRFDNavigation from '../CRFDNavigation';
import unwrapJQ from '../../../../util/unwrapJQ';

interface CRFDIntroPageLayoutConfig {
	dialog: ReturnType<typeof CaseRequestFilingDialog>;
}

let InternalCRFDIntroPageLayout: any;

/**
 * Initializes the process element.
 */
function initCRFDIntroPageLayout() {
	InternalCRFDIntroPageLayout = class CRFDIntroPageLayout extends OO.ui.PageLayout {

		// OOUI internal
		name: string;
		dialog: ReturnType<typeof CaseRequestFilingDialog>;

		/**
		 * @param config
		 */
		constructor( config: CRFDIntroPageLayoutConfig ) {
			super( 'intro', {
				...config,
				expanded: true
			} );

			this.dialog = config.dialog;

			// Asynchronously render the page contents so that CRFDNavigation can access
			// the dialog's true page set.
			setTimeout( () => {
				this.$element.append( this.render() );
			} );
		}

		/**
		 * @return Rendered page content
		 */
		render(): JSX.Element[] {
			const config = window.CCICaseRequestFiler.wikiConfig;

			const nextPageButton = new OO.ui.ButtonWidget( {
				invisibleLabel: true,
				label: mw.msg( 'deputy.ccrf.next' ),
				icon: 'next',
				flags: [ 'primary', 'progressive' ]
			} );
			nextPageButton.on( 'click', () => {
				this.dialog.nextPage();
			} );

			return [
				<div class="wizard-background" role="presentation"/>,
				<div>
					<h1>{mw.msg( 'deputy.ccrf.intro.heading' )}</h1>
					<p style={{
						marginLeft: '1em'
					}}><em>{mw.msg( 'deputy.ccrf.intro.newbies' )}</em></p>
					{ unwrapJQ( <p/>, mw.message(
						'deputy.ccrf.intro.explain1',
						config.cci.rootPage.get().getPrefixedText()
					).parseDom() ) }
					{ unwrapJQ( <p/>, mw.message( 'deputy.ccrf.intro.explain2' ).parseDom() ) }
					{ config.ccrf.introExtra.get() !== null && unwrapJQ( <p/>, msgEval(
						config.ccrf.introExtra.get()
					).parseDom() ) }
					<CRFDNavigation dialog={this.dialog} page={this} />
				</div>
			];
		}

	};
}

/**
 * Creates a new CRFDIntroPageLayout.
 *
 * @param config
 * @return A CRFDIntroPageLayout object
 */
export default function ( config: CRFDIntroPageLayoutConfig ) {
	if ( !InternalCRFDIntroPageLayout ) {
		initCRFDIntroPageLayout();
	}
	return new InternalCRFDIntroPageLayout( config );
}
