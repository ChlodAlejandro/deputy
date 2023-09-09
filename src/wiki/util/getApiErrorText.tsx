import { h } from 'tsx-dom';

/**
 * Get the API error text from an API response.
 *
 * @param errorData
 * @param n Get the `n`th error. Defaults to 0 (first error).
 */
export default function getApiErrorText( errorData: any, n: number = 0 ): string | JQuery {
	// errorformat=html
	return errorData.errors?.[ n ]?.html ?
		<span dangerouslySetInnerHTML={errorData.errors?.[ n ]?.html}/> :
		(
			// errorformat=plaintext/wikitext
			errorData.errors?.[ n ]?.text ??
			// errorformat=bc
			errorData.info
		);
}
