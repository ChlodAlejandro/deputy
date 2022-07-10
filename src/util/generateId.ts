/**
 * Generates an ID using the current time and a random number. Quick and
 * dirty way to generate random IDs.
 *
 * @return A string in the format `TIMESTAMP++RANDOM_NUMBER`
 */
export default function (): string {
	return `${Date.now()}++${Math.random().toString().slice( 2 )}`;
}
