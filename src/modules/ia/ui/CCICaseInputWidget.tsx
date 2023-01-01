import '../../../types';

let InternalCCICaseInputWidget: any;

/**
 * Initializes the process element.
 */
function initCCICaseInputWidget() {
	InternalCCICaseInputWidget = class CCICaseInputWidget extends mw.widgets.TitleInputWidget {

		/**
		 *
		 * @param config
		 */
		constructor( config: any ) {
			super( {
				...config,
				inputFilter: ( value: string ) => {
					const prefix = window.InfringementAssistant.wikiConfig
						.cci.rootPage.get().getPrefixedText() + '/';
					// Simple replace, only 1 replacement made anyway.
					const trimmed = value.replace( prefix, '' ).trim();

					if ( config.inputFilter ) {
						return config.inputFilter( trimmed );
					} else {
						return trimmed;
					}
				}
			} );
		}

		getQueryValue = function () {
			return `${ window.InfringementAssistant.wikiConfig.cci.rootPage.get()
				.getPrefixedText() }/${ this.getValue() }`;
		};

	};
}

/**
 * Creates a new CCICaseInputWidget.
 *
 * @param config Configuration to be passed to the element.
 * @return A CCICaseInputWidget object
 */
export default function ( config: any ) {
	if ( !InternalCCICaseInputWidget ) {
		initCCICaseInputWidget();
	}
	return new InternalCCICaseInputWidget( config );
}
