import { PromiseOrNot } from '../types';

export interface DeputyUIElement {

	/**
	 * Prepare for element injection. This entails changing a few things, such as
	 * hiding MediaWiki-rendered components, etc.
	 */
	prepare?: () => PromiseOrNot<void>;

	/**
	 * Renders the element. This must return an HTMLElement that can be appended
	 * directly to the DOM.
	 */
	render(): HTMLElement;

}
