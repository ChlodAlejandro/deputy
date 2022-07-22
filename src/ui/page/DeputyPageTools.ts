import { DeputyPageMenuOption } from './DeputyPageMenu';

export default () => <DeputyPageMenuOption[]>[
	{
		icon: 'copy',
		label: mw.message( 'deputy.cte' ).text(),
		condition: () => window.deputy.cte.startState,
		action: async () => {
			window.deputy.cte.openEditDialog();
		}
	}
];
