/**
 * Appends extra information to an edit summary (also known as the "advert").
 *
 * @param editSummary The edit summary
 * @return The decorated edit summary (in wikitext)
 */
export default function ( editSummary: string ): string {
	return `${editSummary} ([[User:Chlod/Scripts/Deputy|Deputy]] v${window.deputy.version})`;
}
