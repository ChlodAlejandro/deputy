import 'broadcastchannel-polyfill';
import { ContributionSurveyRowStatus } from './models/ContributionSurveyRow';

/**
 * Generic message used to acknowledge an action. This is usually required by
 * non-root session pages to ensure that the root session is still active.
 *
 * Due to its usage, this message must always have an attached `_deputyRespondsTo`,
 * provided by `LowLevelOneWayDeputyMessage`. Otherwise, it is useless as it is
 * not listened for except as a response.
 */
export interface DeputyAcknowledgeMessage {
	type: 'acknowledge';
}

/**
 * Used to request for session information. Broadcast prior to actual session
 * execution to avoid session conflicts. If no sessions are active, a timeout
 * (default of 500ms) is expected to expire, meaning there are no active sessions.
 */
export interface DeputySessionRequestMessage {
	type: 'sessionRequest';
}

/**
 * Response to {@link DeputyPageStatusRequestMessage}. Contains current case page
 * ID and active sessions.
 */
export interface DeputySessionResponseMessage {
	type: 'sessionResponse';
	caseId: number;
	sections: string[];
}

/**
 * Broadcast whenever a session is closed. This allows tabs that also have an
 * active session to re-render options for starting a session.
 */
export interface DeputySessionClosedMessage {
	type: 'sessionClosed';
	caseId: number;
}

/**
 * Broadcast whenever a session is started. This hides session-starting UI
 * elements from other tabs to avoid session conflicts.
 */
export interface DeputySessionStartedMessage {
	type: 'sessionStarted';
	caseId: number;
}

/**
 * Requests the status of a given page. Used prior to showing the page toolbar.
 * If no response is received, the page is not part of an active CCI session and
 * therefore will not be worked on.
 *
 * An optional `revision` parameter requests information for a specific revision.
 * If checked, the returning {@link DeputyPageStatusResponseMessage} will also
 * provide information on whether the revision is marked as assessed or not.
 */
export interface DeputyPageStatusRequestMessage {
	type: 'pageStatusRequest';
	page: string;
	revision?: number;
}

/**
 * Response to {@link DeputyPageStatusRequestMessage}. Contains the current page
 * status and the revision status (if requested).
 */
export interface DeputyPageStatusResponseMessage {
	type: 'pageStatusResponse';
	caseId: number;
	status: ContributionSurveyRowStatus;
	enabledStatuses: ContributionSurveyRowStatus[];
	// Defined if a revision was given in the request.
	revisionStatus?: boolean;
}

/**
 * Updates all listening instances of Deputy that a page's status (or status options)
 * have changed. This is fired whenever the user manually changes the option, or if an
 * option has been disabled/enabled following a change in the revision list.
 */
export interface DeputyPageStatusUpdateMessage {
	type: 'pageStatusUpdate';
	caseId: number;
	page: string;
	status: ContributionSurveyRowStatus;
	// Newly-enabled options.
	enabledOptions?: ContributionSurveyRowStatus[];
	// Newly-disabled options.
	disabledOptions?: ContributionSurveyRowStatus[];
}

/**
 * A constant map of specific one-way Deputy message types and their respective
 * response messages.
 */
const OneWayDeputyMessageMap = <const>{
	sessionRequest: 'sessionResponse',
	sessionResponse: 'sessionRequest',
	pageStatusRequest: 'pageStatusResponse',
	pageStatusResponse: 'pageStatusRequest',
	pageStatusUpdate: 'acknowledge'
};

export type DeputyRequestMessage = DeputySessionRequestMessage;
export type DeputyResponseMessage = DeputySessionResponseMessage;
export type DeputyMessage =
	| DeputyAcknowledgeMessage
	| DeputyRequestMessage
	| DeputyResponseMessage
	| DeputySessionClosedMessage
	| DeputySessionStartedMessage
	| DeputyPageStatusRequestMessage
	| DeputyPageStatusResponseMessage
	| DeputyPageStatusUpdateMessage;
export type LowLevelDeputyMessage = DeputyMessage & {
	_deputy: true;
	_deputyMessageId: string;
};

export type LowLevelOneWayDeputyMessage = LowLevelDeputyMessage & {
	type: keyof typeof OneWayDeputyMessageMap
};
export type OneWayDeputyMessage = DeputyMessage & {
	type: keyof typeof OneWayDeputyMessageMap
};
// Uses non-low level type in order to avoid requiring `_deputy` flag.
export type OutboundDeputyMessage = LowLevelOneWayDeputyMessage;
export type InboundDeputyMessage = LowLevelOneWayDeputyMessage & {
	_deputyRespondsTo: string;
};
export type LowLevelResponseMessage<T extends OneWayDeputyMessage> = InboundDeputyMessage & {
	type: typeof OneWayDeputyMessageMap[ T[ 'type' ] ];
}
export type ResponseMessage<T extends OneWayDeputyMessage> = DeputyMessage & {
	type: typeof OneWayDeputyMessageMap[ T[ 'type' ] ];
};

export type DeputyMessageEvent<T extends DeputyMessage> = Event & {
	data: LowLevelDeputyMessage & T
};

// TODO: debug
const start = Date.now();
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
			// TODO: debug
			console.log( Date.now() - start, '[deputy comms]: in', event.data );
			if ( event.data && typeof event.data === 'object' && event.data._deputy ) {
				this.dispatchEvent(
					Object.assign( new Event( event.data.type ), {
						data: event.data
					} )
				);
			}
		} );
	}

	/**
	 * Sends data through this broadcast channel.
	 *
	 * @param data
	 * @return The sent message object
	 */
	send( data: DeputyMessage ): LowLevelDeputyMessage {
		const messageId = `${Date.now()}++${Math.random().toString().slice( 2 )}`;
		const message: LowLevelDeputyMessage = Object.assign(
			data, { _deputy: <const>true, _deputyMessageId: messageId }
		);
		this.broadcastChannel.postMessage( message );
		// TODO: debug
		console.log( Date.now() - start, '[deputy comms]: out', data );

		return message;
	}

	/**
	 *
	 * @param original
	 * @param reply
	 */
	reply<T extends LowLevelOneWayDeputyMessage>(
		original: T,
		reply: ResponseMessage<T>
	): void {
		this.send( Object.assign( reply, {
			_deputyRespondsTo: original._deputyMessageId
		} ) );
	}

	/**
	 * Sends a message and waits for the first response. Subsequent responses are
	 * ignored. Returns `null` once the timeout has passed with no responses.
	 *
	 * @param data
	 * @param timeout Time to wait for a response, 500ms by default
	 */
	async sendAndWait<T extends OneWayDeputyMessage>(
		data: T,
		timeout = 500
	): Promise<LowLevelResponseMessage<T> | null> {
		return new Promise<LowLevelResponseMessage<T>>( ( res ) => {
			const message = this.send( data );

			const handlers: {
				listener?: ( event: MessageEvent<LowLevelOneWayDeputyMessage> ) => void,
				timeout?: NodeJS.Timeout
			} = {};
			const clearHandlers = () => {
				if ( handlers.listener ) {
					this.broadcastChannel.removeEventListener( 'message', handlers.listener );
				}
				if ( handlers.timeout ) {
					clearTimeout( handlers.timeout );
				}
			};
			handlers.listener = ( ( event: MessageEvent<InboundDeputyMessage> ) => {
				console.log( event );
				if (
					event.data._deputyRespondsTo === message._deputyMessageId &&
					event.data.type === OneWayDeputyMessageMap[ data.type ]
				) {
					res( event.data as unknown as LowLevelResponseMessage<T> );
					clearHandlers();
				}
			} );
			handlers.timeout = setTimeout( () => {
				res( null );
				clearHandlers();
			}, timeout );
			this.broadcastChannel.addEventListener( 'message', handlers.listener );
		} );
	}

	/**
	 * @param type The type of message to send.
	 * @param callback The callback to call when the message is received.
	 * @param options Optional options for the event listener.
	 * @see {@link EventTarget#addEventListener}
	 */
	addEventListener<T extends LowLevelDeputyMessage[ 'type' ]>(
		type: T,
		callback: ( event: Event & { data: LowLevelDeputyMessage & { type: T } } ) => void,
		options?: AddEventListenerOptions | boolean
	): void {
		super.addEventListener( type, callback, options );
	}

}
