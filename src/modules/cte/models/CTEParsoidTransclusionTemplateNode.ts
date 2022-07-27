import ParsoidDocument from '@chlodalejandro/parsoid';
import CTEParsoidDocument from './CTEParsoidDocument';

/**
 * Extension class of ParsoidDocument's node. Used to type `parsoidDocument` in the
 * below function. Since the original node is always instantiated with `this`, it
 * can be assumed that `parsoidDocument` is a valid CTEParsoidDocument.
 */
export class CTEParsoidTransclusionTemplateNode extends ParsoidDocument.Node {

	/**
	 * @inheritDoc
	 */
	static fromNew(
		document: CTEParsoidDocument,
		template: string,
		parameters?: Record<string, string | { toString(): string; }>,
		autosave?: boolean
	): CTEParsoidTransclusionTemplateNode {
		return this.upgradeNode( super.fromNew(
			document, template, parameters, autosave
		), document );
	}

	/**
	 * Upgrades a vanilla ParsoidDocument.Node to a CTEParsoidTransclusionTemplateNode.
	 *
	 * @param node The node to upgrade
	 * @param document The document to attach
	 * @return A CTEParsoidTransclusionTemplateNode
	 */
	static upgradeNode(
		node: InstanceType<typeof ParsoidDocument.Node>,
		document: CTEParsoidDocument
	) {
		return new CTEParsoidTransclusionTemplateNode(
			document, node.element, node.data, node.i, node.autosave
		);
	}

	parsoidDocument: CTEParsoidDocument;
}
