import 'broadcastchannel-polyfill';

export interface DeputySessionRequestMessage {
	type: 'sessionRequest';
}

export interface DeputySessionResponseMessage {
	type: 'sessionResponse';
	case: string;
	sections: number[];
}

export type DeputyRequestMessage = DeputySessionRequestMessage;
export type DeputyResponseMessage = DeputySessionResponseMessage;
export type DeputyMessage = DeputyRequestMessage | DeputyResponseMessage;

/**
 * Handles inter-tab communication and automatically broadcasts events
 * to listeners.
 */
export default class DeputyCommunications extends EventTarget {

	broadcastChannel: BroadcastChannel;

	/**
	 * Initialize communications. Begins listening for messages from other tabs.
	 */
	init() {
		// Polyfills are loaded for BroadcastChannel support on older browsers.
		// eslint-disable-next-line compat/compat
		this.broadcastChannel = new BroadcastChannel( 'deputy-itc' );

		this.broadcastChannel.addEventListener( 'message', ( event ) => {
			if ( event.data && typeof event.data === 'object' ) {
				this.dispatchEvent(
					new CustomEvent<DeputyMessage>( event.type, { detail: event.data } )
				);
			}
		} );
	}

	/**
	 * @param type The type of message to send.
	 * @param callback The callback to call when the message is received.
	 * @param options Optional options for the event listener.
	 * @see {@link EventTarget#addEventListener}
	 */
	addEventListener<T extends DeputyMessage[ 'type' ]>(
		type: T,
		callback: ( event: CustomEvent<DeputyMessage & { type: T }> ) => void,
		options?: AddEventListenerOptions | boolean
	): void {
		super.addEventListener( type, callback, options );
	}

}
