import Setting, { VisibleDisplayOptions } from './Setting';
import { PromiseOrNot } from '../types';

/**
 * A button that performs an action when clicked. Shown in the preferences screen,
 * and acts exactly like a setting, but always holds a value of 'null'.
 */
export class Action extends Setting<undefined, undefined> {

	onClick: () => PromiseOrNot<void>;

	/**
	 * @param onClick
	 * @param displayOptions
	 */
	public constructor(
		onClick: () => PromiseOrNot<void>,
		displayOptions: Omit<VisibleDisplayOptions, 'type'> = {}
	) {
		super( {
			serialize: () => undefined,
			deserialize: () => undefined,
			displayOptions: Object.assign(
				{},
				displayOptions,
				{ type: <const>'button' }
			)
		} );
		this.onClick = onClick;
	}

}
