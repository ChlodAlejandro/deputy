/**
 * Wraps a set of nodes in a div.dp-cs-extraneous element.
 *
 * @param children The nodes to wrap
 */
export default function DeputyExtraneousElement( children: Node | Node[] ): HTMLElement {
	const container = document.createElement( 'div' );
	container.classList.add( 'dp-cs-extraneous' );
	children = Array.isArray( children ) ? children : [ children ];
	children.forEach( child => container.appendChild( child.cloneNode( true ) ) );
	return container;
}
