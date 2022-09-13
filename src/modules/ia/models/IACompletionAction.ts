export enum IACompletionAction {
	Nothing,
	Reload,
	Redirect
}

export const IACompletionActionSettingProperties = {
	serialize: ( value: IACompletionAction ) => ( <const>{
		[ IACompletionAction.Nothing ]: 'nothing',
		[ IACompletionAction.Reload ]: undefined,
		[ IACompletionAction.Redirect ]: 'redirect'
	} )[ value ],
	deserialize: ( value: 'nothing' | 'reload' | 'redirect' ) => ( <const>{
		nothing: IACompletionAction.Nothing,
		reload: IACompletionAction.Reload,
		redirect: IACompletionAction.Redirect
	} )[ value ],
	defaultValue: IACompletionAction.Reload,
	allowedValues: {
		nothing: IACompletionAction.Nothing,
		reload: IACompletionAction.Reload,
		redirect: IACompletionAction.Redirect
	}
};
