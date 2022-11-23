import Setting from './Setting';
import MwApi from '../MwApi';
import { CopyrightProblemsResponseSet } from '../modules/ia/models/CopyrightProblemsResponse';
import { generateEnumConfigurationProperties, PortletNameView } from './types';
import { CompletionAction, TripleCompletionAction } from '../modules/shared/CompletionAction';
import { EnumValue } from '../types';
import DeputyVersion from '../DeputyVersion';
import ConfigurationBase from './ConfigurationBase';
import {
	ContributionSurveyRowSigningBehavior
} from '../models/ContributionSurveyRowSigningBehavior';

/**
 * A configuration. Defines settings and setting groups.
 */
export default class UserConfiguration extends ConfigurationBase {

	static readonly configVersion = 1;
	static readonly optionKey = 'userjs-deputy';

	/**
	 * @return the configuration from the current wiki.
	 */
	static load(): UserConfiguration {
		const config = new UserConfiguration();
		try {
			if ( mw.user.options.get( UserConfiguration.optionKey ) ) {
				const decodedOptions = JSON.parse(
					mw.user.options.get( UserConfiguration.optionKey )
				);
				config.deserialize( decodedOptions );
			}
		} catch ( e ) {
			console.error( e, mw.user.options.get( UserConfiguration.optionKey ) );
			mw.hook( 'deputy.i18nDone' ).add( function notifyConfigFailure() {
				mw.notify( mw.msg( 'deputy.loadError.userConfig' ), {
					type: 'error'
				} );
				mw.hook( 'deputy.i18nDone' ).remove( notifyConfigFailure );
			} );
			config.save();
		}
		return config;
	}

	public readonly core = <const>{
		/**
		 * Numerical code that identifies this config version. Increments for every breaking
		 * configuration file change.
		 */
		configVersion: new Setting<number, number>( {
			defaultValue: UserConfiguration.configVersion,
			displayOptions: { hidden: true },
			alwaysSave: true
		} ),
		language: new Setting<string, string>( {
			defaultValue: mw.config.get( 'wgUserLanguage' ),
			displayOptions: { type: 'select' }
		} ),
		modules: new Setting<string[], string[]>( {
			defaultValue: [ 'cci', 'ante', 'ia' ],
			displayOptions: { type: 'checkboxes' },
			allowedValues: [ 'cci', 'ante', 'ia' ]
		} ),
		portletNames: new Setting<
			EnumValue<typeof PortletNameView>,
			PortletNameView
		>(
			generateEnumConfigurationProperties( PortletNameView, PortletNameView.Full )
		)
	};
	public readonly cci = <const>{
		enablePageToolbar: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				type: 'checkbox'
			}
		} ),
		forceUtc: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: {
				type: 'checkbox'
			}
		} ),
		signingBehavior: new Setting<
			EnumValue<typeof ContributionSurveyRowSigningBehavior>,
			ContributionSurveyRowSigningBehavior
		>(
			generateEnumConfigurationProperties(
				ContributionSurveyRowSigningBehavior,
				ContributionSurveyRowSigningBehavior.Always
			)
		),
		openOldOnContinue: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: {
				type: 'checkbox'
			}
		} )
	};
	public readonly ante = <const>{
		enableAutoMerge: new Setting<boolean, boolean>( {
			defaultValue: false,
			displayOptions: {
				type: 'checkbox',
				disabled: 'unimplemented'
			}
		} ),
		onSubmit: new Setting<
			EnumValue<typeof CompletionAction>,
			CompletionAction
		>(
			generateEnumConfigurationProperties( CompletionAction, CompletionAction.Reload )
		)
	};
	public readonly ia = <const>{
		responses: new Setting<
			CopyrightProblemsResponseSet, CopyrightProblemsResponseSet
		>( {
			...Setting.basicSerializers,
			defaultValue: null,
			displayOptions: {
				disabled: 'unimplemented',
				type: 'unimplemented'
			}
		} ),
		enablePageToolbar: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				type: 'checkbox',
				disabled: 'unimplemented'
			}
		} ),
		defaultEntirePage: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				type: 'checkbox'
			}
		} ),
		defaultFromUrls: new Setting<boolean, boolean>( {
			defaultValue: true,
			displayOptions: {
				type: 'checkbox'
			}
		} ),
		onHide: new Setting<
			EnumValue<typeof TripleCompletionAction>,
			TripleCompletionAction
		>( generateEnumConfigurationProperties(
			TripleCompletionAction,
			TripleCompletionAction.Reload
		) ),
		onSubmit: new Setting<
			EnumValue<typeof TripleCompletionAction>,
			TripleCompletionAction
			>( generateEnumConfigurationProperties(
				TripleCompletionAction,
				TripleCompletionAction.Reload
			) ),
		onBatchSubmit: new Setting<
			EnumValue<typeof CompletionAction>,
			CompletionAction
			>( generateEnumConfigurationProperties(
				CompletionAction,
				CompletionAction.Reload
			) )
	};

	public readonly all = { core: this.core, cci: this.cci, ante: this.ante, ia: this.ia };

	/**
	 * Creates a new Configuration.
	 *
	 * @param serializedData
	 */
	protected constructor( serializedData: any = {} ) {
		super();

		if ( serializedData ) {
			this.deserialize( serializedData );
		}

		if ( mw.storage.get( `mw-${UserConfiguration.optionKey}-lastVersion` ) !== DeputyVersion ) {
			// Version change detected.
			// Do nothing... for now.
		}
		mw.storage.set( `mw-${UserConfiguration.optionKey}-lastVersion`, DeputyVersion );
	}

	/**
	 * Saves the configuration.
	 */
	async save(): Promise<void> {
		await MwApi.action.saveOption(
			UserConfiguration.optionKey, JSON.stringify( this.serialize() )
		);
	}

}
