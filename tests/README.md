# Deputy tests

## Unit tests
Deputy unit tests are run directly on the English Wikipedia and are usually used
to test static functions and other stateless functions. These are not expected to
edit actual Wikipedia pages (because in such a case, the user would be logged out).

## Integration tests
Deputy integration tests are run on the Test Wikipedia in order to avoid editing on
actual English Wikipedia pages. To perform editing tests, user login details must
be provided with the `TESTWIKI_USERNAME` and `TESTWIKI_PASSWORD` environment variables.
Otherwise, those tests will be skipped.

A policy of making as minimal edits as required is implemented for integration tests.
As much as possible, an edit should not be made directly on the wiki (and instead the
request should just be marked as "done").
