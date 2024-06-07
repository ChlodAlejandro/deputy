import decorateEditSummary from './decorateEditSummary';
import delink from './delink';
import errorToOO from './errorToOO';
import findSectionHeading from './findSectionHeading';
import getApiErrorText from './getApiErrorText';
import getNativeRange from './getNativeRange';
import getPageContent from './getPageContent';
import getPageExists from './getPageExists';
import getPageTitle from './getPageTitle';
import getRevisionContent from './getRevisionContent';
import getRevisionDiffURL from './getRevisionDiffURL';
import getRevisionURL from './getRevisionURL';
import getSectionElements from './getSectionElements';
import getSectionHTML from './getSectionHTML';
import getSectionId from './getSectionId';
import guessAuthor from './guessAuthor';
import isWikiHeading from './isWikiHeading';
import msgEval from './msgEval';
import normalizeTitle from './normalizeTitle';
import normalizeWikiHeading from './normalizeWikiHeading';
import nsId from './nsId';
import openWindow from './openWindow';
import pagelinkToTitle from './pagelinkToTitle';
import parseDiffUrl from './parseDiffUrl';
import performHacks from './performHacks';
import purge from './purge';
import renderWikitext from './renderWikitext';
import sectionHeadingN from './sectionHeadingN';
import toRedirectsObject from './toRedirectsObject';
export default {
	decorateEditSummary: decorateEditSummary,
	delink: delink,
	errorToOO: errorToOO,
	findSectionHeading: findSectionHeading,
	getApiErrorText: getApiErrorText,
	getNativeRange: getNativeRange,
	getPageContent: getPageContent,
	getPageExists: getPageExists,
	getPageTitle: getPageTitle,
	getRevisionContent: getRevisionContent,
	getRevisionDiffURL: getRevisionDiffURL,
	getRevisionURL: getRevisionURL,
	getSectionElements: getSectionElements,
	getSectionHTML: getSectionHTML,
	getSectionId: getSectionId,
	guessAuthor: guessAuthor,
	isWikiHeading: isWikiHeading,
	msgEval: msgEval,
	normalizeTitle: normalizeTitle,
	normalizeWikiHeading: normalizeWikiHeading,
	nsId: nsId,
	openWindow: openWindow,
	pagelinkToTitle: pagelinkToTitle,
	parseDiffUrl: parseDiffUrl,
	performHacks: performHacks,
	purge: purge,
	renderWikitext: renderWikitext,
	sectionHeadingN: sectionHeadingN,
	toRedirectsObject: toRedirectsObject
};
