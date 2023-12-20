import { h } from 'tsx-dom';
import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import deputyVersion, {
	gitAbbrevHash,
	gitDate,
	gitBranch,
	gitVersion
} from '../../DeputyVersion';
import type WikiConfiguration from '../../config/WikiConfiguration';
import unwrapJQ from '../../util/unwrapJQ';

interface ConfigurationGroupTabPanelOptions extends OO.ui.TabPanelLayout.ConfigOptions {

	config: WikiConfiguration;
	group: keyof WikiConfiguration['all'];

}

let InternalConfigurationGroupTabPanel: any;

/**
 * Initializes the process element.
 */
function initConfigurationGroupTabPanel() {
	InternalConfigurationGroupTabPanel = class ConfigurationGroupTabPanel
		extends OO.ui.TabPanelLayout {

		// OOUI
		config: ConfigurationGroupTabPanelOptions;
		tabItem: OO.ui.TabOptionWidget;

		static readonly logoUrl =
			'https://upload.wikimedia.org/wikipedia/commons/2/2b/Deputy_logo.svg';

		/**
		 * @return The {@Link Setting}s for this group.
		 */
		get settings() {
			return this.config.config.all[ this.config.group ];
		}

		/**
		 */
		constructor() {
			super( 'configurationGroupPage_About' );

			this.$element.append( <div>
				<div class="deputy-about">
					<div style="flex: 0"><img src={
						ConfigurationGroupTabPanel.logoUrl
					} alt="Deputy logo"/></div>
					<div style="flex: 1">
						<div>
							<div>{ mw.msg( 'deputy.name' ) }</div>
							<div>{ mw.msg(
								'deputy.about.version',
								deputyVersion,
								gitAbbrevHash
							) }</div>
						</div>
						<div>{ mw.msg( 'deputy.description' ) }</div>
					</div>
				</div>
				<div>
					<a href="https://w.wiki/7NWR" target="_blank">{
						unwrapWidget( new OO.ui.ButtonWidget( {
							label: mw.msg( 'deputy.about.homepage' ),
							flags: [ 'progressive' ]
						} ) )
					}</a>
					<a href="https://github.com/ChlodAlejandro/deputy" target="_blank">{
						unwrapWidget( new OO.ui.ButtonWidget( {
							label: mw.msg( 'deputy.about.openSource' ),
							flags: [ 'progressive' ]
						} ) )
					}</a>
					<a href="https://w.wiki/7NWS" target="_blank">{
						unwrapWidget( new OO.ui.ButtonWidget( {
							label: mw.msg( 'deputy.about.contact' ),
							flags: [ 'progressive' ]
						} ) )
					}</a>
				</div>
				{unwrapJQ( <p/>, mw.message( 'deputy.about.credit' ).parseDom() )}
				{unwrapJQ( <p/>, mw.message( 'deputy.about.license',
					'https://www.apache.org/licenses/LICENSE-2.0',
					'https://github.com/ChlodAlejandro/deputy'
				).parseDom() ) }
				{unwrapJQ( <p/>, mw.message( 'deputy.about.thirdParty',
					'https://github.com/ChlodAlejandro/deputy#licensing'
				).parseDom() )}
				{unwrapJQ( <p style={{ fontSize: '0.9em', color: 'darkgray' }} />, mw.message(
					'deputy.about.buildInfo',
					gitVersion as string,
					gitBranch as string,
					new Date( gitDate as string ).toLocaleString()
				).parseDom() )}
				{ unwrapJQ( <p style={{ fontSize: '0.9em', color: 'darkgray' }} />, mw.message(
					'deputy.about.footer'
				).parseDom() ) }
			</div> );
		}

		/**
		 * Sets up the tab item
		 */
		setupTabItem() {
			this.tabItem.setLabel( mw.msg( 'deputy.about' ) );
			return this;
		}

	};
}

/**
 * Creates a new ConfigurationGroupTabPanel.
 *
 * @return A ConfigurationGroupTabPanel object
 */
export default function () {
	if ( !InternalConfigurationGroupTabPanel ) {
		initConfigurationGroupTabPanel();
	}
	return new InternalConfigurationGroupTabPanel();
}
