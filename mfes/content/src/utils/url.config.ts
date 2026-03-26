import { getContentBaseUrl } from '@shared-lib';

export const URL_CONFIG = {
  PARAMS: {
    CONTENT_GET:
      'transcripts,ageGroup,posterImage,appIcon,artifactUrl,attributions,attributions,audience,author,badgeAssertions,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType',
    LICENSE_DETAILS: 'name,description,url',
    HIERARCHY_FEILDS: 'instructions,outcomeDeclaration',
  },
  API: {
    get CONTENT_READ() { return `${getContentBaseUrl()}/interface/v1/api/content/v1/read/`; },
    get HIERARCHY_API() { return `${getContentBaseUrl()}/interface/v1/action/questionset/v2/hierarchy/`; },
    get FRAMEWORK_READ() { return `${getContentBaseUrl()}/interface/v1/api/framework/v1/read/`; },
    get QUESTIONSET_READ() { return `${getContentBaseUrl()}/interface/v1/action/questionset/v2/read/`; },
    get COMPOSITE_SEARCH() { return `${getContentBaseUrl()}/interface/v1/action/composite/v3/search`; },
    get CONTENT_HIERARCHY() { return `${getContentBaseUrl()}/interface/v1/action/content/v3/hierarchy`; },
  },
};
