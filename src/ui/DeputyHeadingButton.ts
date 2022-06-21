/**
 *
 */
export default class DeputyHeadingButton {

	private readonly buttonSize = 1.2;
	private readonly buttonPadding = 0.4;

	/**
	 *
	 * @param el
	 */
	append( el: HTMLElement ) {
		if ( el.tagName === 'H2' ) {
			el.appendChild( this.render() );
		}
	}

	/**
	 *
	 */
	render(): HTMLElement {
		const container = document.createElement( 'div' );
		container.classList.add( 'deputy', 'dp-heading' );

		const buttonContainer = document.createElement( 'div' );
		buttonContainer.style.position = 'absolute';
		buttonContainer.style.left = `-${this.buttonSize + this.buttonPadding}em`;
		buttonContainer.style.bottom = '0';
		buttonContainer.style.width = `${this.buttonSize}em`;
		buttonContainer.style.height = `${this.buttonSize}em`;

		const sessionStartButton = new window.OO.ui.ButtonWidget( {
			label: 'Start session',
			icon: 'play',
			title: 'Start session',
			invisibleLabel: true
		} );
		$( buttonContainer ).append( sessionStartButton.$element );

		const containerPadding = document.createElement( 'div' );
		containerPadding.style.position = 'absolute';
		containerPadding.style.left = `-${this.buttonPadding}em`;
		containerPadding.style.bottom = '0';
		containerPadding.style.width = `${this.buttonPadding}em`;
		containerPadding.style.height = `${this.buttonSize}em`;

		container.appendChild( buttonContainer );
		container.appendChild( containerPadding );
		return container;
	}

}
