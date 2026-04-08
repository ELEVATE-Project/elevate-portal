import { getEnvValue, getContentBaseUrl } from '@shared-lib';

export const URL_CONFIG = {
  PARAMS: {
    CONTENT_GET:
      'transcripts,ageGroup,appIcon,artifactUrl,attributions,attributions,audience,author,badgeAssertions,body,channel,code,concepts,contentCredits,contentType,contributors,copyright,copyrightYear,createdBy,createdOn,creator,creators,description,displayScore,domain,editorState,flagReasons,flaggedBy,flags,framework,identifier,itemSetPreviewUrl,keywords,language,languageCode,lastUpdatedOn,license,mediaType,mimeType,name,originData,osId,owner,pkgVersion,publisher,questions,resourceType,scoreDisplayConfig,status,streamingUrl,template,templateId,totalQuestions,totalScore,versionKey,visibility,year,primaryCategory,additionalCategories,interceptionPoints,interceptionType',
    LICENSE_DETAILS: 'name,description,url',
    HIERARCHY_FEILDS: 'instructions,outcomeDeclaration',
  },
  API: {
    get CONTENT_READ() { return `${getContentBaseUrl()}/interface/v1/api/content/v1/read/`; },
    get HIERARCHY_API() { return `${getContentBaseUrl()}/interface/v1/action/questionset/v2/hierarchy/`; },
    get 
    () { return `${getContentBaseUrl()}/interface/v1/api/framework/v1/read/`; },
    get QUESTIONSET_READ() { return `${getContentBaseUrl()}/interface/v1/action/questionset/v2/read/`; },
    get COMPOSITE_SEARCH() { return `${getContentBaseUrl()}/interface/v1/action/composite/v3/search`; },
    get CONTENT_HIERARCHY() { return `${getContentBaseUrl()}/interface/v1/action/content/v3/hierarchy`; },
  },
};

export interface Pdata {
  id: string;
  pid?: string;
  ver?: string;
}

export interface ContextRollup {
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
}

export interface Cdata {
  type: string;
  id: string;
}

export interface ObjectRollup {
  l1?: string;
  l2?: string;
  l3?: string;
  l4?: string;
}

export interface Context {
  mode?: string;
  authToken?: string;
  sid?: string;
  did?: any;
  uid?: string;
  channel: string;
  pdata: Pdata;
  contextRollup?: ContextRollup;
  tags?: string[];
  cdata?: Cdata[];
  timeDiff?: number;
  objectRollup?: ObjectRollup;
  host?: string;
  endpoint?: string;
  dispatcher?: object;
  partner?: any[];
  contentId?: any;
  dims?: any[];
  app?: string[];
  userData?: {
    firstName: string;
    lastName: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Config {
  toolBar?: {
    showZoomButtons?: boolean;
    showPagesButton?: boolean;
    showPagingButtons?: boolean;
    showSearchButton?: boolean;
    showRotateButton?: boolean;
  };
  sideMenu?: {
    showShare?: boolean;
    showDownload?: boolean;
    showReplay?: boolean;
    showExit?: boolean;
    showPrint?: boolean;
  };
  [propName: string]: any;
}

export interface Metadata {
  identifier: string;
  name: string;
  artifactUrl: string;
  streamingUrl?: string;
  compatibilityLevel?: number;
  pkgVersion?: number;
  isAvailableLocally?: boolean;
  basePath?: string;
  baseDir?: string;
}
export interface PlayerConfig {
  context?: Context;
  config?: Config;
  metadata?: Metadata;
  data?: any;
}

export const MIME_TYPE = {
  QUESTION_SET_MIME_TYPE: 'application/vnd.sunbird.questionset',
  INTERACTIVE_MIME_TYPE: [
    'application/vnd.ekstep.h5p-archive',
    'application/vnd.ekstep.html-archive',
    'application/vnd.ekstep.ecml-archive',
  ],
};

export const getTelemetryConfig = (): Context => {
  let localStorageData = {
    userName: '',
    accToken: '',
    tenantId: '',
    tenantCode: '',
    did: '',
    sid: '',
    uid: '',
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    const ls = window.localStorage;
    localStorageData = {
      userName: ls.getItem('userIdName') ?? '',
      accToken: ls.getItem('token') ?? '',
      sid: ls.getItem('token') ?? '',
      uid: ls.getItem('userId') ?? '',
      tenantId: ls.getItem('tenantId') ?? '',
      tenantCode: ls.getItem('channelId') ?? '',
      did: ls.getItem('did') ?? '',
    };
  }
  return {
    mode: 'play',
    partner: [],
    pdata: {
      id: 'pratham.admin.portal',
      ver: '1.0.0',
      pid: 'admin-portal',
    },
    contentId: '',
    timeDiff: -0.089,
    channel: localStorageData.tenantCode,
    tags: [localStorageData.tenantCode],
    contextRollup: { l1: localStorageData.tenantCode },
    objectRollup: {},
    userData: { firstName: localStorageData.userName, lastName: '' },
    host: process.env.NEXT_PUBLIC_CONTENT_BASE_URL,
    endpoint: '/v1/telemetry',
    ...localStorageData,
  };
};

export const V2PlayerConfig: PlayerConfig = {
  context: getTelemetryConfig(),
  config: {
    showEndPage: false,
    endPage: [{ template: 'assessment', contentType: ['SelfAssess'] }],
    showStartPage: true,
    host: process.env.NEXT_PUBLIC_CONTENT_BASE_URL,
    overlay: { showUser: false },
    splash: {
      text: '',
      icon: '',
      bgImage: 'assets/icons/splacebackground_1.png',
      webLink: '',
    },
    apislug: '',
    repos: ['/sunbird-plugins/renderer'],
    plugins: [
      { id: 'org.sunbird.iframeEvent', ver: 1, type: 'plugin' },
      { id: 'org.sunbird.player.endpage', ver: 1.1, type: 'plugin' },
    ],
    sideMenu: {
      showShare: false,
      showDownload: true,
      showExit: true,
      showPrint: false,
      showReplay: true,
    },
  },
  data: {},
};

export const V1PlayerConfig: PlayerConfig = {
  config: {
    whiteListUrl: [],
    showEndPage: true,
    endPage: [
      {
        template: 'assessment',
        contentType: ['SelfAssess'],
      },
    ],
    showStartPage: true,
    host: process.env.NEXT_PUBLIC_CONTENT_BASE_URL,
    endpoint: '/v1/telemetry',
    overlay: {
      enableUserSwitcher: true,
      showOverlay: true,
      showNext: true,
      showPrevious: true,
      showSubmit: false,
      showReload: false,
      showUser: false,
      showExit: true,
      menu: {
        showTeachersInstruction: false,
      },
    },
    splash: {
      text: '',
      icon: '',
      bgImage: 'assets/icons/splacebackground_1.png',
      webLink: '',
    },
    apislug: '',
    repos: ['/sunbird-plugins/renderer'],
    plugins: [
      {
        id: 'org.sunbird.iframeEvent',
        ver: 1,
        type: 'plugin',
      },
      {
        id: 'org.sunbird.player.endpage',
        ver: 1.1,
        type: 'plugin',
      },
    ],
    sideMenu: {
      showShare: true,
      showDownload: true,
      showExit: true,
    },
    enableTelemetryValidation: false,
  },
  context: getTelemetryConfig(),
  data: {},
};
