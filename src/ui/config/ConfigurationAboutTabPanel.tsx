import { h } from 'tsx-dom';
import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import deputyVersion, {
	gitAbbrevHash,
	gitDate,
	gitBranch,
	gitVersion
} from '../../DeputyVersion';
import WikiConfiguration from '../../config/WikiConfiguration';

let InternalConfigurationGroupTabPanel: any;

/**
 * Initializes the process element.
 */
function initConfigurationGroupTabPanel() {
	InternalConfigurationGroupTabPanel = class ConfigurationGroupTabPanel
		extends OO.ui.TabPanelLayout {

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
					<a href="https://w.wiki/5k$q" target="_blank">{
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
					<a href="https://w.wiki/5k$p" target="_blank">{
						unwrapWidget( new OO.ui.ButtonWidget( {
							label: mw.msg( 'deputy.about.contact' ),
							flags: [ 'progressive' ]
						} ) )
					}</a>
				</div>
				<p dangerouslySetInnerHTML={ mw.msg( 'deputy.about.credit' ) }/>
				<p dangerouslySetInnerHTML={ mw.msg( 'deputy.about.license',
					'https://www.apache.org/licenses/LICENSE-2.0',
					'https://github.com/ChlodAlejandro/deputy'
				) }/>
				<p dangerouslySetInnerHTML={ mw.msg( 'deputy.about.thirdParty',
					'https://github.com/ChlodAlejandro/deputy#licensing'
				) }/>
				<p
					style={{ fontSize: '0.9em', color: 'darkgray' }}
					dangerouslySetInnerHTML={ mw.msg(
						'deputy.about.buildInfo',
						gitVersion as string,
						gitBranch as string,
						new Date( gitDate as string ).toLocaleString()
					) }
				/>
				<p
					style={{ fontSize: '0.9em', color: 'darkgray' }}
					dangerouslySetInnerHTML={ mw.msg( 'deputy.about.footer' ) }
				/>
			</div> );
		}

		/**
		 * Sets up the tab item
		 */
		setupTabItem() {
			this.tabItem.setLabel( mw.msg( 'deputy.about' ) );
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
