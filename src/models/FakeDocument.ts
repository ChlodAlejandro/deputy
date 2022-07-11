import removeElement from '../util/removeElement';

/**
 * Fake document. Used to load in entire HTML pages without having to append them to the
 * actual DOM or use JQuery.
 */
export default class FakeDocument {

	/**
	 * Creates a fake document and waits for the `document` to be ready.
	 *
	 * @param data Data to include in the iframe
	 */
	static async build( data: Blob | BlobPart[] ): Promise<FakeDocument> {
		const fakeDoc = new FakeDocument( data );
		await fakeDoc.waitForDocument();
		return fakeDoc;
	}

	iframe: HTMLIFrameElement;
	ready = false;

	/**
	 * @return The document of the iframe
	 */
	get document(): Document {
		return this.iframe.contentDocument;
	}

	/**
	 * @param data Data to include in the iframe
	 */
	constructor( data: Blob | BlobPart[] ) {
		this.iframe = document.createElement( 'iframe' );
		this.iframe.style.display = 'none';
		this.iframe.addEventListener( 'load', () => {
			this.ready = true;
		} );
		this.iframe.src = URL.createObjectURL(
			data instanceof Blob ? data : new Blob( data )
		);
		// Disables JavaScript, modals, popups, etc., but allows same-origin access.
		this.iframe.setAttribute( 'sandbox', 'allow-same-origin' );

		document.getElementsByTagName( 'body' )[ 0 ].appendChild( this.iframe );
	}

	/**
	 * Returns the Document of the iframe when ready.
	 */
	async waitForDocument(): Promise<Document> {
		while (
			!this.ready ||
			this.document == null ||
			!this.document.getElementsByTagName( 'body' )[ 0 ]
				.classList.contains( 'mediawiki' )
		) {
			await new Promise( ( res ) => {
				setTimeout( res, 10 );
			} );
		}
		return this.document;
	}

	/**
	 * Performs cleanup
	 */
	close() {
		removeElement( this.iframe );
	}

}
