import '../../types';
import unwrapWidget from '../../util/unwrapWidget';
import DeputyCasePage from '../../wiki/DeputyCasePage';
import DeputyContributionSurveySection from '../DeputyContributionSurveySection';

// This is one of those "TypeScript, trust me" moments. This is what happens when
// a library can't handle ES extends. I pray that some day OOUI can be an
// actually-usable library that uses exports instead of... this...

type DeputyReviewDialogFunction = ( ( config: any ) => void ) & {
	static: any,
	super: any
};

interface DeputyReviewDialogData {
	from: string,
	to: string,
	casePage: DeputyCasePage,
	section: DeputyContributionSurveySection
}

/**
 * @param config
 */
const DeputyReviewDialog: DeputyReviewDialogFunction = function ( config: any & {
	data: DeputyReviewDialogData
} ) {
	config.size = config.size || 'larger';
	( DeputyReviewDialog as any ).super.call( this, config );
} as DeputyReviewDialogFunction;

OO.inheritClass( DeputyReviewDialog, OO.ui.ProcessDialog );

DeputyReviewDialog.static.name = 'deputyReviewDialog';
DeputyReviewDialog.static.title = 'Review your changes';
DeputyReviewDialog.static.actions = [
	{ action: 'cancel', label: 'Cancel', flags: 'safe' }
];

// Add content to the dialog body and setup event handlers.
DeputyReviewDialog.prototype.initialize = function ( ...args: [] ) {
	DeputyReviewDialog.super.prototype.initialize.apply( this, args );

	this.element = unwrapWidget(
		new OO.ui.ProgressBarWidget( {
			progress: false
		} )
	);
	this.content = new OO.ui.PanelLayout( { padded: true } );
	unwrapWidget( this.content ).appendChild( this.element );
	this.$body.append( this.content.$element );
};

DeputyReviewDialog.prototype.getReadyProcess = function ( data: DeputyReviewDialogData ) {
	return DeputyReviewDialog.prototype.getReadyProcess.call( this, data )
		.next( async () => {
			window.deputy.wiki.get( {
				fromtitle: data.casePage.title.getPrefixedText()
				// TODO: Work here.

			} );
		} );
};
