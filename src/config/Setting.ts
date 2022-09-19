/**
 * Defines interface UI elements.
 */
import Configuration from './Configuration';
import { ArrayOrNot } from '../types';
import getObjectValues from '../util/getObjectValues';

interface DisplayOptionsBase {

	/**
	 * Overridden name. DO NOT USE unless there is good reason to.
	 *
	 * By default, the name will be taken from internationalization strings. Its key follows
	 * the format "deputy.setting.<group>.<settingName>.name".
	 */
	name?: string;
	/**
	 * Overridden description. DO NOT USE unless there is good reason to.
	 *
	 * By default, the description will be taken from internationalization strings. Its key follows
	 * the format "deputy.setting.<group>.<settingName>.description".
	 */
	description?: string;
	/**
	 * Whether an option should be disabled or not.
	 */
	disabled?: boolean | string | ( ( config: Configuration ) => boolean | string );

}

interface VisibleDisplayOptions extends DisplayOptionsBase {
	/**
	 * The type of UI element to display.
	 */
	type: 'text' | 'number' | 'checkbox' | 'select' | 'radio' | 'checkboxes' | 'unimplemented';
	/**
	 * Whether an option should be hidden or not. If an option is hidden, it will not
	 * show up in the settings interface at all.
	 */
	hidden?: false | ( ( config: Configuration ) => boolean | string );
}

interface HiddenDisplayOptions extends DisplayOptionsBase {
	/**
	 * Whether an option should be hidden or not. If an option is hidden, it will not
	 * show up in the settings interface at all.
	 */
	hidden?: true;
	type?: never;
}

export type DisplayOptions = HiddenDisplayOptions | VisibleDisplayOptions;

/**
 * Types that can be handled by the in-built JSON serializer normally.
 */
type NativeTransformerType = ArrayOrNot<boolean | number | string | null | undefined>;
type SelfTransformer<TargetType, SourceType> = ( value?: SourceType ) => TargetType;
type SelfTransformerParameter<Key extends string, TargetType, SourceType> =
	SourceType extends NativeTransformerType & TargetType?
		(
			// Custom serializer
			Partial<Record<Key, SelfTransformer<TargetType, SourceType>>>
		) :
		Record<Key, SelfTransformer<TargetType, SourceType>>;
type Transformer<TargetType, SourceType> = ( value: SourceType ) => TargetType;
type TransformerParameter<Key extends string, TargetType, SourceType> =
	SourceType extends NativeTransformerType & TargetType ?
		(
			// Custom serializer
			Partial<Record<Key, Transformer<TargetType, SourceType>>>
		) :
		Record<Key, Transformer<TargetType, SourceType>>;

/**
 * Refers to a specific setting on the configuration. Should be initialized with
 * a raw (serialized) type and an actual (deserialized) type.
 *
 * This is used for both client and wiki-wide configuration.
 */
export default class Setting<SerializedType, DeserializedType> {

	static readonly basicSerializers = {
		serialize: ( value: any ) => value,
		deserialize: ( value: any ) => value
	};

	/**
	 * Display options for this setting when showing up on settings interfaces.
	 */
	readonly displayOptions?: DisplayOptions;
	/**
	 * Allowed values for this setting. Specific values may be provided, or an object of
	 * "choice objects": value mapped by the choice label (to be used to get the choice
	 * text from i18n, e.g. `deputy.setting.<group>.<name>.choice.<choice>`). When an array is
	 * passed, the key to be used for i18n is equal to the result of the allowed value's `toString`
	 * function.
	 *
	 * When using allowedValues, as much as possible use primitive types as the deserialized
	 * type, since `indexOf` is used to check if a value is allowed, which may not work properly
	 * for class instances or objects.
	 */
	readonly allowedValues?: Record<string, DeserializedType> | DeserializedType[];

	/**
	 * The current value of the setting.
	 */
	private value: DeserializedType;

	/**
	 * Serialize this setting's value or a given value.
	 *
	 * @param value The value to serialize
	 */
	serialize?: Transformer<SerializedType, DeserializedType>;

	/**
	 * Parse a serialized value into a deserialized one.
	 *
	 * @param raw The raw value to parse.
	 * @return The parsed value.
	 */
	deserialize?: Transformer<DeserializedType, SerializedType>;

	/**
	 *
	 * @param options
	 * @param options.serialize Serialization function. See {@link Setting#serialize}
	 * @param options.deserialize Deserialization function. See {@link Setting#deserialize}
	 * @param options.defaultValue Default value. If not supplied, `undefined` is used.
	 * @param options.displayOptions See {@link Setting#displayOptions}
	 * @param options.allowedValues See {@link Setting#allowedValues}
	 */
	public constructor(
		options: {
			displayOptions: DisplayOptions,
			defaultValue?: DeserializedType,
			allowedValues?: Setting<SerializedType, DeserializedType>['allowedValues']
		} &
			SelfTransformerParameter<'serialize', SerializedType, DeserializedType> &
			TransformerParameter<'deserialize', DeserializedType, SerializedType>
	) {
		this.displayOptions = options.displayOptions;
		this.allowedValues = options.allowedValues;
		this.value = options.defaultValue;
	}

	/**
	 * @return if this option is disabled or not.
	 */
	get disabled(): boolean | string {
		return typeof this.displayOptions.disabled !== 'function' ?
			this.displayOptions.disabled :
			this.displayOptions.disabled.call( this );
	}

	/**
	 * @return if this option is hidden or not.
	 */
	get hidden(): boolean | string {
		return typeof this.displayOptions.hidden !== 'function' ?
			this.displayOptions.hidden :
			this.displayOptions.hidden.call( this );
	}

	/**
	 * @return The current value of this setting.
	 */
	get(): DeserializedType {
		return this.value;
	}

	/**
	 * Sets the value and performs validation. If the input is an invalid value, and
	 * `throwOnInvalid` is false, the value will be reset to default.
	 *
	 * @param v
	 * @param throwOnInvalid
	 */
	set( v: DeserializedType, throwOnInvalid = false ) {
		const keys = Array.isArray( this.allowedValues ) ?
			this.allowedValues : getObjectValues( this.allowedValues );
		if ( this.allowedValues && keys.indexOf( v ) === -1 ) {
			if ( throwOnInvalid ) {
				throw new Error( 'Invalid value' );
			}
			v = this.value;
		}
		this.value = v;
	}

	/**
	 * Parses a given raw value and mutates the setting.
	 *
	 * @param raw The raw value to parse.
	 * @return The new value.
	 */
	load( raw: SerializedType ): DeserializedType {
		return ( this.value = this.deserialize( raw ) );
	}

}
