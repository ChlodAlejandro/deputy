import EarwigCopyvioDetector from '../../wiki/EarwigCopyvioDetector';
import { DeputyPageMenuOption } from './DeputyPageMenu';

export default () => <DeputyPageMenuOption[]>[
	{
		icon: 'eye',
		label: mw.msg( 'deputy.session.page.earwigLatest' ),
		action: async ( toolbar ) => {
			const url = await EarwigCopyvioDetector.getUrl( toolbar.row.title );
			window.open( url, '_blank', 'noopener' );

			if ( url == null ) {
				mw.notify(
					mw.msg( 'deputy.session.page.earwigUnsupported' ),
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
		label: mw.msg( 'deputy.session.page.earwigRevision' ),
		condition: ( toolbar ) => toolbar.revision != null,
		action: async ( toolbar ) => {
			const url = await EarwigCopyvioDetector.getUrl( toolbar.revision );

			if ( url == null ) {
				mw.notify(
					mw.msg( 'deputy.session.page.earwigUnsupported' ),
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
