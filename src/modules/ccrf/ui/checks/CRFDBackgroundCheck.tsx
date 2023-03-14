import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import unwrapWidget from '../../../../util/unwrapWidget';
import { h } from 'tsx-dom';
import { BackgroundChecks } from '../../BackgroundChecks';
import swapElements from '../../../../util/swapElements';

/**
 *
 */
export default abstract class CRFDBackgroundCheck<T> {

	progressBarWidget: typeof OO.ui.ProgressBarWidget;
	mainElement: JSX.Element;

	/**
	 *
	 * @param checkName
	 * @param task
	 */
	protected constructor(
		readonly checkName: keyof BackgroundChecks,
		readonly task: DeputyDispatchTask<T>
	) {
		this.task.addEventListener( 'progress', ( event: CustomEvent ) => {
			this.progressBarWidget?.setProgress( event.detail );
		} );
		this.task.addEventListener( 'finished', () => {
			this.progressBarWidget?.setProgress( 1 );
			this.task.waitUntilDone().then( ( v ) => {
				swapElements( this.mainElement, this.renderCheckResults( v ) );
			} );
		} );
	}

	/**
	 * @param key The message key to get
	 * @return a message for this specific check
	 */
	msg( key: string ) {
		return mw.msg( `deputy.ccrf.check.${this.checkName}.${key}` );
	}

	/**
	 * Renders the check's results.
	 *
	 * @param data
	 */
	abstract renderCheckResults( data: T ): JSX.Element;

	/**
	 * Renders the progress bar.
	 *
	 * @return A JSX Element
	 */
	renderProgressBar(): JSX.Element {
		return unwrapWidget( this.progressBarWidget = new OO.ui.ProgressBarWidget( {
			progress: 0
		} ) );
	}

	/**
	 * @return The rendered page layout
	 */
	render() {
		return <div class="crfd-background-check">
			<div class="crfd-background-check--header">
				{ unwrapWidget( new OO.ui.IconWidget( { icon: 'ellipsis' } ) ) }
				<span>{
					mw.msg( this.msg( 'load' ) )
				}</span>
			</div>
			{ this.mainElement = this.renderProgressBar() }
		</div>;
	}

}
