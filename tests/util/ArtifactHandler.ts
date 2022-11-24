import * as path from 'path';
import * as fs from 'fs/promises';

/**
 *
 */
export default class ArtifactHandler {

	static readonly executionDate =
		new Date().toISOString().replace( /:/g, '.' );
	static readonly artifactsPath =
		path.resolve( __dirname, '..', 'artifacts' );

	/**
	 * Saves an artifact to the artifacts folder.
	 *
	 * @param filename
	 * @param data
	 */
	static async save( filename: string, data: string | Buffer ): Promise<void> {
		await fs.mkdir(
			path.join( this.artifactsPath, this.executionDate ),
			{ recursive: true }
		);
		await fs.writeFile(
			path.join( this.artifactsPath, this.executionDate, filename ),
			data
		);
	}

}
