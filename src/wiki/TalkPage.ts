import normalizeTitle from '../util/normalizeTitle';
import decorateEditSummary from '../util/decorateEditSummary';

/**
 * Options for performing edits with {@link TalkPage}.
 */
interface TalkPageEditOptions {
	/**
	 * The <b>undecorated</b> summary to use for this edit.
	 */
	summary?: string;
}

/**
 * Class responsible for handling talk page actions (posting messages, sections, etc.)
 */
export default class TalkPage {

	talkPage: mw.Title;

	/**
	 * @param basePage The subject/talk page to get the talk page of
	 */
	constructor( basePage: mw.Title | string ) {
		const normalizedTitle = normalizeTitle( basePage );
		if ( normalizedTitle.isTalkPage() ) {
			this.talkPage = normalizedTitle;
		} else if ( normalizedTitle.canHaveTalkPage() ) {
			this.talkPage = normalizedTitle.getTalkPage();
		} else {
			throw new Error( normalizedTitle.getPrefixedText() + ' cannot have a talk page' );
		}
	}

	/**
	 * Appends to the talk page. By default, two newlines are appended before the message
	 * provided. To disable this, set the `newLines` option to 0.
	 *
	 * No signature is appended; one must already be present in `message`.
	 *
	 * @param message The message to append
	 * @param options Extra option
	 * @param editOptions Data to be directly passed into the POST request.
	 */
	async append(
		message: string,
		options: TalkPageEditOptions & { newLines?: number; } = {},
		editOptions: Record<string, any> = {}
	): Promise<void> {
		const finalMessage = '\n'.repeat( ( options.newLines ?? 2 ) ) + message;
		await window.deputy.wiki.postWithEditToken(
			Object.assign( {
				// Overridable options.
				redirect: this.talkPage.getNamespaceId() !==
					mw.config.get( 'wgNamespaceIds' ).user_talk
			}, editOptions, {
				// Non-overridable options
				action: 'edit',
				title: this.talkPage.getPrefixedText(),
				summary: decorateEditSummary( options.summary ),
				appendtext: finalMessage
			} )
		);
	}

	/**
	 * Creates a new section on the talk page.
	 *
	 * No signature is appended; one must already be present in `message`.
	 *
	 * @param sectionTitle The title of the section
	 * @param message The message to place in the section
	 * @param options Extra option
	 * @param editOptions Data to be directly passed into the POST request.
	 */
	async addNewSection(
		sectionTitle: string,
		message: string,
		options: TalkPageEditOptions = {},
		editOptions: Record<string, any> = {}
	): Promise<void> {
		await window.deputy.wiki.newSection(
			this.talkPage,
			sectionTitle,
			message,
			Object.assign( {
				// Overridable options.
				redirect: this.talkPage.getNamespaceId() !==
					mw.config.get( 'wgNamespaceIds' ).user_talk
			}, editOptions, {
				// Non-overridable options
				summary: decorateEditSummary( options.summary )
			} )
		);
	}

}
