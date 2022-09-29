import cloneRegex from '../../util/cloneRegex';

/**
 * Delinks wikitext. Does not handle templates. Only does dumb delinking (RegExp
 * replacement; does not parse and handle link nesting, etc.).
 *
 * @param string
 * @return delinked wikitext
 */
export default function delink( string: string ): string {
	return string.replace( cloneRegex( /\[\[(.+?)(?:\|.*?)?]]/g ), '$1' );
}
