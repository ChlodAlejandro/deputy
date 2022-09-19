import { DeputyPageMenuOption } from './DeputyPageMenu';

export default () => <DeputyPageMenuOption[]>[
	{
		icon: 'copy',
		label: mw.msg( 'deputy.ante' ),
		condition: () => window.deputy.ante.startState,
		action: async () => {
			window.deputy.ante.openEditDialog();
		}
	},
	{
		icon: 'flag',
		label: mw.msg( 'deputy.ia' ),
		condition: () => true,
		action: async () => {
			await window.deputy.ia.openWorkflowDialog();
		}
	}
];
