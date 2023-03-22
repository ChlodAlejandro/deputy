import { DeputyDispatchTask } from '../../../../api/DispatchAsync';
import unwrapWidget from '../../../../util/unwrapWidget';
import { h } from 'tsx-dom';
import { BackgroundChecks } from '../../BackgroundChecks';
import swapElements from '../../../../util/swapElements';
import { DispatchUserDeletedPagesResponse } from '../../../../api/types/DispatchTypes';

/**
 *
 */
export default abstract class BackgroundCheck<T> {

	progressBarWidget: typeof OO.ui.ProgressBarWidget;
	element: JSX.Element;
	headerElement: JSX.Element;
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
		// Trigger render so that UI elements are available when events fire.
		this.render();

		this.task.addEventListener( 'progress', ( event: CustomEvent ) => {
			this.progressBarWidget?.setProgress( event.detail );
		} );
		this.task.addEventListener( 'finished', () => {
			this.progressBarWidget?.setProgress( 1 );
			this.task.waitUntilDone().then( ( v ) => {
				const message = this.getResultMessage( v );
				this.headerElement =
					swapElements(
						this.headerElement,
						this.renderHeader( message.icon, message.message )
					);
				this.mainElement =
					swapElements( this.mainElement, this.renderCheckResults( v ) );
			} );
		} );
	}

	/**
	 * @param key The message key to get
	 * @param {...any} params
	 * @return a message for this specific check
	 */
	msg( key: string, ...params: string[] ): string {
		return mw.msg( `deputy.ccrf.check.${this.checkName}.${key}`, ...params );
	}

	/**
	 * Renders the check's results.
	 *
	 * @param data
	 */
	abstract renderCheckResults( data: T ): JSX.Element;

	abstract getResultMessage( data: T ): {
		icon: string, message: string
	};

	/**
	 * Renders the header
	 *
	 * @param icon
	 * @param message
	 * @return A JSX Element
	 */
	renderHeader( icon: string, message: string ): JSX.Element {
		return <div class="ccrf-background-check--header">
			{ unwrapWidget( new OO.ui.IconWidget( { icon } ) ) }
			<span>{message}</span>
		</div>;
	}

	/**
	 * Renders the progress bar.
	 *
	 * @return A JSX Element
	 */
	renderProgressBar(): JSX.Element {
		return unwrapWidget(
			this.progressBarWidget ??
			( this.progressBarWidget = new OO.ui.ProgressBarWidget( {
				progress: this.task.progress ?? 0
			} ) )
		);
	}

	/**
	 * @return The rendered page layout
	 */
	render() {
		return this.element ?? ( this.element = <div class="ccrf-background-check">
			{ this.headerElement =
				this.renderHeader( 'ellipsis', this.msg( 'load' ) ) }
			{ this.mainElement = this.renderProgressBar() }
		</div> );
	}

}
