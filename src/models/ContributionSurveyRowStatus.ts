export enum ContributionSurveyRowStatus {
	// The row has not been processed yet.
	Unfinished = 0,
	// The row has a comment but cannot be parsed
	Unknown = 1,
	// The row has been processed and violations were found ({{y}})
	WithViolations = 2,
	// The row has been processed and violations were not found ({{n}})
	WithoutViolations = 3,
	// The row has been found but the added text is no longer in the existing revision
	Missing = 4,
	// The row has been processed and text was presumptively removed ({{x}}),
	PresumptiveRemoval = 5
}
