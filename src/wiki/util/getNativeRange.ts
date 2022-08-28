/**
 * Converts a range-like Object into a native Range object.
 *
 * @param rangeLike The range to convert
 * @param rangeLike.startContainer
 * @param rangeLike.startOffset
 * @param rangeLike.endContainer
 * @param rangeLike.endOffset
 * @return A {@link Range} object.
 */
export default function ( rangeLike: {
	startContainer: Element,
	startOffset: number,
	endContainer: Element,
	endOffset: number
} ): Range {
	const doc = rangeLike.startContainer.ownerDocument;
	const nativeRange = doc.createRange();
	nativeRange.setStart( rangeLike.startContainer, rangeLike.startOffset );
	nativeRange.setEnd( rangeLike.endContainer, rangeLike.endOffset );
	return nativeRange;
}
