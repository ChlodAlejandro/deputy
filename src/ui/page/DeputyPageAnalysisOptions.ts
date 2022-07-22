import EarwigCopyvioDetector from '../../wiki/EarwigCopyvioDetector';
import { DeputyPageMenuOption } from './DeputyPageMenu';

export default () => <DeputyPageMenuOption[]>[
	{
		icon: 'eye',
		label: mw.message( 'deputy.session.page.earwigLatest' ).text(),
		action: async ( toolbar ) => {
			const url = await EarwigCopyvioDetector.getUrl( toolbar.row.title );
			window.open( url, '_blank', 'noopener' );

			if ( url == null ) {
				mw.notify(
					mw.message( 'deputy.session.page.earwigUnsupported' ).text(),
					{
						type: 'error'
					}
				);
			} else {
				window.open( url, '_blank', 'noopener' );
			}
		}
	},
	{
		icon: 'eye',
		label: mw.message( 'deputy.session.page.earwigRevision' ).text(),
		condition: ( toolbar ) => toolbar.revision != null,
		action: async ( toolbar ) => {
			const url = await EarwigCopyvioDetector.getUrl( toolbar.revision );

			if ( url == null ) {
				mw.notify(
					mw.message( 'deputy.session.page.earwigUnsupported' ).text(),
					{
						type: 'error'
					}
				);
			} else {
				window.open( url, '_blank', 'noopener' );
			}
		}
	}
];
