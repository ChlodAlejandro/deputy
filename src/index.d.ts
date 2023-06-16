declare namespace OO.ui {
	interface Process {
		first<C = null>(
			step: Process.Step<C>
				| Promise<C>
				| ( ( this: C ) => Promise<
					boolean | number | JQuery.Promise<void> | Error | [Error] | void
				> ),
			context?: C
		): this;
		next<C = null>(
			step: Process.Step<C>
				| Promise<C>
				| ( ( this: C ) => Promise<
					boolean | number | JQuery.Promise<void> | Error | [Error] | void
				> ),
			context?: C
		): this;
	}


	namespace Process {
		interface Constructor {
			new (): Process;
		}
	}

	namespace IndexLayout {
		interface Prototype extends MenuLayout.Prototype {
			addTabPanels(tabPanels: TabPanelLayout[], index?: number): this;
		}
	}

	namespace TagMultiselectWidget {
		interface ConfigOptions {
			placeholder?: string;
		}
	}


	namespace OptionWidget {
		interface ConfigOptions {
			selected?: boolean;
		}
	}

	interface BookletLayout {
		// @private
		pages: OO.ui.PageLayout[];
	}

	namespace BookletLayout {
		interface Prototype {
			addPages(pages: OO.ui.PageLayout[], index?: number): this;
		}
	}

	namespace Window {
		interface Static {
			// Implementation can be found at:
			// src/modules/ante/CopiedTemplateEditor.ts:178
			size: Size | `huge`;
		}
	}
}
