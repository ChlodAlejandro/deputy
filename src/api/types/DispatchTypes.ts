import type { DeletedPage } from 'deputy-dispatch/src/models/DeletedPage';
import type { DeletedRevision } from 'deputy-dispatch/src/models/DeletedRevision';

export interface DispatchUserDeletedPagesResponse {

	pages: DeletedPage[];

}
export interface DispatchUserDeletedRevisionsResponse {

	revisions: DeletedRevision[];

}
