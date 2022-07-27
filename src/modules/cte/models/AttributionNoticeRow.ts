import type AttributionNotice from './AttributionNotice';
import { AttributionNoticePageGenerator } from '../ui/pages/AttributionNoticePageGenerator';
import { AttributionNoticePageLayout } from '../ui/pages/AttributionNoticePageLayout';

/**
 * An attribution notice's row or entry.
 */
export abstract class AttributionNoticeRow<T extends AttributionNotice>
implements AttributionNoticePageGenerator {

	/**
	 * @return The parent of this attribution notice row.
	 */
	abstract get parent(): T;
	abstract generatePage( dialog: any ): AttributionNoticePageLayout;

}
