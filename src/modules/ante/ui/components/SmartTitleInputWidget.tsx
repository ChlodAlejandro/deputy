import normalizeTitle from '../../../../wiki/util/normalizeTitle';

let InternalSmartTitleInputWidget: any;

/**
 * Initializes the process element.
 */
function initSmartTitleInputWidget() {
	InternalSmartTitleInputWidget = class SmartTitleInputWidget
		extends mw.widgets.TitleInputWidget {

		data: any;

		/**
		 * @param config Configuration to be passed to the element.
		 */
		constructor( config: any ) {
			super( Object.assign( config, {
				// Force this to be true
				allowSuggestionsWhenEmpty: true
			} ) );
		}

		/**
		 * @inheritDoc
		 */
		getRequestQuery(): string {
			const v = super.getRequestQuery();
			return v || normalizeTitle().getSubjectPage().getPrefixedText();
		}

		/**
		 * @inheritDoc
		 */
		getQueryValue(): string {
			const v = super.getQueryValue();
			return v || normalizeTitle().getSubjectPage().getPrefixedText();
		}
	};
}

/**
 * Creates a new SmartTitleInputWidget.
 *
 * @param config Configuration to be passed to the element.
 * @return A SmartTitleInputWidget object
 */
export default function ( config: any ) {
	if ( !InternalSmartTitleInputWidget ) {
		initSmartTitleInputWidget();
	}
	return new InternalSmartTitleInputWidget( config );
}
