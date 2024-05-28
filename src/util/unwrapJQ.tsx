import { h } from 'tsx-dom';

/**
 * Get the nodes from a JQuery object and wraps it in an element.
 *
 * @param element The element to add the children into
 * @param $j The JQuery object
 * @return The original element, now with children
 */
export default function unwrapJQ( element = <span/>, $j: JQuery ): JSX.Element {
	$j.each( ( i, e ) => element.append( e ) );
	return element;
}
