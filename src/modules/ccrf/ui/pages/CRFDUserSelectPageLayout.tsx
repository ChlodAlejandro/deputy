import { h } from 'tsx-dom';
import '../../../../types';
import type CaseRequestFilingDialog from '../CaseRequestFilingDialog';
import CRFDNavigation from '../CRFDNavigation';
import MwApi from '../../../../MwApi';
import unwrapWidget from '../../../../util/unwrapWidget';
import normalizeTitle from '../../../../wiki/util/normalizeTitle';
import nsId from '../../../../wiki/util/nsId';

interface CRFDUserSelectPageLayoutConfig {
	dialog: ReturnType<typeof CaseRequestFilingDialog>;
}

let InternalCRFDUserSelectPageLayout: any;

/**
 * Initializes the process element.
 */
function initCRFDUserSelectPageLayout() {
	InternalCRFDUserSelectPageLayout = class CRFDUserSelectPageLayout extends OO.ui.PageLayout {

		// OOUI internal
		name: string;
		dialog: ReturnType<typeof CaseRequestFilingDialog>;

		/**
		 * @param config
		 */
		constructor( config: CRFDUserSelectPageLayoutConfig ) {
			super( 'userSelect', {
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
		render(): JSX.Element {
			const input = new mw.widgets.UserInputWidget( {
				api: MwApi.action,
				placeholder: mw.msg( 'deputy.ccrf.step1.placeholder' )
			} );
			const field = new OO.ui.FieldLayout( input, {
				align: 'top',
				label: mw.msg( 'deputy.ccrf.step1.placeholder' ),
				invisibleLabel: true
			} );

			// Attach paste handling
			unwrapWidget( input )
				.querySelector( 'input' )
				.addEventListener( 'paste', ( event ) => {
					const text = event.clipboardData.getData( 'text/plain' );

					try {
						const url = new URL( text, window.location.href );
						const title = normalizeTitle(
							url.searchParams.get( 'title' ) ??
							new RegExp( mw.util.getUrl( '(.*)' ) ).exec(
								url.pathname
							)?.[ 1 ] ??
							null
						);

						const mainText = title.getMainText();
						if (
							title.namespace === nsId( 'user' ) ||
							title.namespace === nsId( 'user_talk' )
						) {
							// Paste in the username only
							input.setValue( mainText.replace( /\/.*/, '' ) );
							event.preventDefault();
						} else if (
							title.namespace === nsId( 'special' )
						) {
							// Special page. Try to get the username from the latter portion of the
							// title. Only do this for special pages that we know are user-related.
							const allowedSpecialPages = [
								'contributions/',
								'block/',
								'emailuser/',
								'userrights/',
								'prefixindex/user:',
								'prefixindex/user_talk:'
							];
							for ( const prefix of allowedSpecialPages ) {
								if ( !mainText.toLowerCase().startsWith( prefix ) ) {
									continue;
								}

								input.setValue(
									mainText.replace(
										new RegExp( `^${prefix}`, 'i' ),
										''
									)
								);
								event.preventDefault();
								break;
							}
						}
					} catch ( e ) {
						// Not a URL, paste as normal
					}
				} );

			input.on( 'change', () => {
				field.setErrors( [] );
			} );

			const preNext = async () => {
				field.setErrors( [] );
				if ( !( await input.getValidity().then( () => true, () => false ) ) ) {
					field.setErrors( [ mw.msg( 'deputy.ccrf.step1.error.invalid' ) ] );
					return false;
				} else {
					const user = await MwApi.action.get( {
						action: 'query',
						list: 'users',
						ususers: input.getValue()
					} ).then( d => d.query.users[ 0 ] );
					if ( user.invalid ) {
						field.setErrors( [ mw.msg( 'deputy.ccrf.step1.error.invalid' ) ] );
						return false;
					} else if ( user.missing ) {
						field.setErrors( [ mw.msg( 'deputy.ccrf.step1.error.notfound' ) ] );
						return false;
					} else {
						await this.dialog.userCheckPage.setUser( user.name );
						return true;
					}
				}
			};

			return <div>
				<h1>{mw.msg( 'deputy.ccrf.step1.heading' )}</h1>
				<p>{mw.msg( 'deputy.ccrf.step1.details' )}</p>
				{ Object.values( this.dialog.getEnabledChecks() ).some( v => v ) &&
					<p>{mw.msg( 'deputy.ccrf.step1.details2' )}</p>
				}
				{unwrapWidget( field )}
				<CRFDNavigation dialog={this.dialog} page={this} preNext={preNext} />
			</div>;
		}

	};
}

/**
 * Creates a new CRFDUserSelectPageLayout.
 *
 * @param config
 * @return A CRFDUserSelectPageLayout object
 */
export default function ( config: CRFDUserSelectPageLayoutConfig ) {
	if ( !InternalCRFDUserSelectPageLayout ) {
		initCRFDUserSelectPageLayout();
	}
	return new InternalCRFDUserSelectPageLayout( config );
}
