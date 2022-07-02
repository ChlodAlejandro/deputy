import { h } from 'tsx-dom';

/**
 * Loading dots.
 *
 * @return Loading dots.
 */
export default function (): JSX.Element {
	return <div class="dp--loadingDots">
		<span class="dp-loadingDots-1"/>
		<span class="dp-loadingDots-2"/>
		<span class="dp-loadingDots-3"/>
	</div>;
}
