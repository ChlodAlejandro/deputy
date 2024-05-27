import decorateEditSummary from './decorateEditSummary';
import delink from './delink';
import errorToOO from './errorToOO';
import getApiErrorText from './getApiErrorText';
import getNativeRange from './getNativeRange';
import getPageContent from './getPageContent';
import getPageTitle from './getPageTitle';
import getRevisionContent from './getRevisionContent';
import getRevisionDiffURL from './getRevisionDiffURL';
import getRevisionURL from './getRevisionURL';
import getSectionHTML from './getSectionHTML';
import getSectionId from './getSectionId';
import getWikiHeadingLevel from './getWikiHeadingLevel';
import guessAuthor from './guessAuthor';
import isWikiHeading from './isWikiHeading';
import msgEval from './msgEval';
import normalizeTitle from './normalizeTitle';
import nsId from './nsId';
import openWindow from './openWindow';
import pagelinkToTitle from './pagelinkToTitle';
import parseDiffUrl from './parseDiffUrl';
import performHacks from './performHacks';
import purge from './purge';
import renderWikitext from './renderWikitext';
import sectionHeadingId from './sectionHeadingId';
import sectionHeadingN from './sectionHeadingN';
import sectionHeadingName from './sectionHeadingName';
import toRedirectsObject from './toRedirectsObject';
export default {
	decorateEditSummary: decorateEditSummary,
	delink: delink,
	errorToOO: errorToOO,
	getApiErrorText: getApiErrorText,
	getNativeRange: getNativeRange,
	getPageContent: getPageContent,
	getPageTitle: getPageTitle,
	getRevisionContent: getRevisionContent,
	getRevisionDiffURL: getRevisionDiffURL,
	getRevisionURL: getRevisionURL,
	getSectionHTML: getSectionHTML,
	getSectionId: getSectionId,
	getWikiHeadingLevel: getWikiHeadingLevel,
	guessAuthor: guessAuthor,
	isWikiHeading: isWikiHeading,
	msgEval: msgEval,
	normalizeTitle: normalizeTitle,
	nsId: nsId,
	openWindow: openWindow,
	pagelinkToTitle: pagelinkToTitle,
	parseDiffUrl: parseDiffUrl,
	performHacks: performHacks,
	purge: purge,
	renderWikitext: renderWikitext,
	sectionHeadingId: sectionHeadingId,
	sectionHeadingN: sectionHeadingN,
	sectionHeadingName: sectionHeadingName,
	toRedirectsObject: toRedirectsObject
};
