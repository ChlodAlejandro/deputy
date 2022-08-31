import { DeputyPageMenuOption } from './DeputyPageMenu';

export default () => <DeputyPageMenuOption[]>[
	{
		icon: 'copy',
		label: mw.message( 'deputy.ante' ).text(),
		condition: () => window.deputy.ante.startState,
		action: async () => {
			window.deputy.ante.openEditDialog();
		}
	},
	{
		icon: 'flag',
		label: mw.message( 'deputy.ia' ).text(),
		condition: () => true,
		action: async () => {
			await window.deputy.ia.openWorkflowDialog();
		}
	}
];
