import type { DeletedPage } from '../models/DeletedPage';
import type { DeletedRevision } from '../models/DeletedRevision';

export interface DispatchUserDeletedPagesResponse {

	pages: DeletedPage[];

}
export interface DispatchUserDeletedRevisionsResponse {

	revisions: DeletedRevision[];

}
