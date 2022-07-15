/**
 * Represents a template in a `data-mw` attribute.
 */
export interface TemplateData {
	/**
	 * Information on the template.
	 */
	template: {
		/**
		 * The template target.
		 */
		target: {
			/**
			 * The wikitext of the template.
			 */
			wt: string;
			/**
			 * A link to the template relative to $wgArticlePath.
			 */
			href: string;
		},
		/**
		 * The properties of this template.
		 */
		params: {
			[key: string]: {
				wt: string;
			}
		},
		/**
		 * The identifier of this template within the {@link MediaWikiData}.
		 */
		i: number;
	}
}

/**
 * Represents a callback for template data-modifying operations.
 */
export type TemplateDataModifier = ( templateData: TemplateData ) => TemplateData | null;

/**
 * Represents the contents of a `data-mw` attribute.
 */
export interface MediaWikiData {
	/**
	 * The parts of this data object. Realistically, this field doesn't
	 * just include templates but also extensions as well, but we don't
	 * need those for this userscript.
	 */
	parts: ( TemplateData | string | any )[];
}
