import '../../../../types';
import type CaseRequestFilingDialog from '../CaseRequestFilingDialog';
import CRFDNavigation from '../CRFDNavigation';
import unwrapWidget from '../../../../util/unwrapWidget';
import DeputyMessageWidget from '../../../../ui/shared/DeputyMessageWidget';
import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import { BackgroundChecks } from '../../BackgroundChecks';

interface CRFDUserCheckPageLayoutConfig {
	dialog: ReturnType<typeof CaseRequestFilingDialog>;
}

let InternalCRFDUserCheckPageLayout: any;

/**
 * Initializes the process element.
 */
function initCRFDUserCheckPageLayout() {
	InternalCRFDUserCheckPageLayout = class CRFDUserCheckPageLayout extends OO.ui.PageLayout {

		// OOUI internal
		name: string;
		dialog: ReturnType<typeof CaseRequestFilingDialog>;

		user: string = null;
		userChecks: Record<keyof BackgroundChecks, DeputyDispatchTask<any>>;

		mainContainer: JSX.Element = null;
		userCheckElements: Record<keyof BackgroundChecks, JSX.Element>;

		/**
		 * @param config
		 */
		constructor( config: CRFDUserCheckPageLayoutConfig ) {
			super( 'userCheck', {
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
		 * Sets the new user and triggers checks
		 *
		 * @param newUser
		 */
		setUser( newUser: string ): void {
			if ( this.user !== newUser ) {
				this.user = newUser;
				// TODO: Start checks
			}
		}

		/**
		 * Renders the box that appears if no user was selected. This should,
		 * realistically, never be shown to users unless something direly wrong has
		 * happened.
		 *
		 * @return A JSX Element
		 */
		renderNoUserMessageBox(): JSX.Element {
			return unwrapWidget( DeputyMessageWidget( {
				label: mw.msg( 'deputy.ccrf.step2.noUser' )
			} ) );
		}

		/**
		 *
		 */
		renderUserChecks(): JSX.Element {
			return <div></div>;
		}

		/**
		 * Renders the interface when all checks are disabled. In this case, no
		 * background checks cannot be performed, so instead we'll ask the user to do
		 * it themselves.
		 *
		 * @return An array of JSX.Elements
		 */
		renderManualInterface(): JSX.Element[] {
			return [
				<p>{mw.msg( 'deputy.ccrf.step2.fallback' )}</p>,
				<ul>
					<li dangerouslySetInnerHTML={
						mw.message( 'deputy.ccrf.step2.fallback.link1', this.user ).parse()
					}/>
					<li dangerouslySetInnerHTML={
						mw.message( 'deputy.ccrf.step2.fallback.link2', this.user ).parse()
					}/>
				</ul>,
				<p>{mw.msg( 'deputy.ccrf.step2.fallback2' )}</p>
			];
		}

		/**
		 * Renders the interface when all checks are enabled.
		 *
		 * @param checks The enabled checks
		 * @return An array of JSX.Elements
		 */
		renderChecksInterface( checks: BackgroundChecks ): JSX.Element[] {
			const checkList = <ul/>;
			if ( checks.page ) {
				checkList.appendChild( <li>{
					mw.msg( 'deputy.ccrf.step2.details.page', this.user )
				}</li> );
			}
			if ( checks.revision ) {
				checkList.appendChild( <li>
					{mw.msg( 'deputy.ccrf.step2.details.revisions', this.user )}
					<ul>
						<li>{
							mw.msg( 'deputy.ccrf.step2.details.revisions.note', this.user )
						}</li>
					</ul>
				</li> );
			}
			if ( checks.warnings ) {
				checkList.appendChild( <li>{
					mw.msg( 'deputy.ccrf.step2.details.warnings', this.user )
				}</li> );
			}

			return [
				<p>{mw.msg( 'deputy.ccrf.step2.details' )}</p>,
				checkList,
				<p dangerouslySetInnerHTML={mw.message( 'deputy.ccrf.step2.details2' ).parse()} />,
				( this.mainContainer = this.renderNoUserMessageBox() )
			];
		}

		/**
		 * @return Rendered page content
		 */
		render(): JSX.Element {
			const checks = this.dialog.getEnabledChecks();

			return <div>
				<h1>{mw.msg( 'deputy.ccrf.step2.heading' )}</h1>
				{ ...( Object.values( checks ).every( v => !v ) ?
					this.renderManualInterface() :
					this.renderChecksInterface( checks )
				) }
				<CRFDNavigation dialog={this.dialog} page={this} />
			</div>;
		}

	};
}

/**
 * Creates a new CRFDUserCheckPageLayout.
 *
 * @param config
 * @return A CRFDUserCheckPageLayout object
 */
export default function ( config: CRFDUserCheckPageLayoutConfig ) {
	if ( !InternalCRFDUserCheckPageLayout ) {
		initCRFDUserCheckPageLayout();
	}
	return new InternalCRFDUserCheckPageLayout( config );
}
