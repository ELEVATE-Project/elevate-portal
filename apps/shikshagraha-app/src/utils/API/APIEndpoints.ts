import { getEnvValue, getBaseUrl, getSunbirdBaseUrl, getOrgId } from '@shared-lib';
export const getTeacherSbPlayer = () => getEnvValue('NEXT_PUBLIC_TEACHER_SBPLAYER') || '';

export const API_ENDPOINTS = {
  contentRead: (doId: string) =>
    `${getBaseUrl()}/api/content/v1/read/${doId}?fields=artifactUrl`,
  get academicYearsList() { return `${getBaseUrl()}/academicyears/list`; },
  get accountCreate() { return `${getBaseUrl()}/account/create`; },
  userUpdate: (userId: string) => `${getBaseUrl()}/user/update/${userId}`,
  myCohorts: (userId: string | string[]) =>
    `${getBaseUrl()}/cohort/mycohorts/${userId}`,
  get authRefresh() { return `${getBaseUrl()}/account/auth/refresh`; },
  get authLogout() { return `${getBaseUrl()}/account/auth/logout`; },
  get userAuth() { return `${getBaseUrl()}/user/auth`; },

  get accountLogin() { return `${getBaseUrl()}/user/v1/account/login`; },
  get sendOtp() { return `${getBaseUrl()}/user/v1/account/registrationOtp`; },
  get userProfileRead() { return `${getBaseUrl()}/user/v1/user/read`; },
  get resetPassword() { return `${getBaseUrl()}/user/v1/account/changePassword`; },
  get formRead() { return `${getBaseUrl()}/user/v1/form/read`; },
  get ForgotPassword() { return `${getBaseUrl()}/user/v1/account/resetPassword`; },
  get sendForgetOtp() { return `${getBaseUrl()}/user/v1/account/generateOtp`; },
  get deleteAccount() { return `${getBaseUrl()}/user/v1/account/delete`; },
  get roleRead() { return `${getBaseUrl()}/entity-management/v1/entities/entityListBasedOnEntityType?entityType=professional_role`; },
  get userCreate() { return `${getBaseUrl()}/interface/v1/account/create`; },
  get tenantRead() { return `${getBaseUrl()}/user/v1/public/branding`; },
  checkUser: (email: string) =>
    `${getBaseUrl()}/user/v1/public/checkUsername?username=${email}`,
  udiseSearch: (udise: string) =>
    `${getBaseUrl()}/entity-management/v1/entities/details/${udise}`,
  get fieldOptionsRead() { return `${getBaseUrl()}/fields/options/read`; },
  get cohortSearch() { return `${getBaseUrl()}/cohort/search`; },
  fieldOptionDelete: (type: string, option: string) =>
    `${getBaseUrl()}/fields/options/delete/${type}?option=${option}`,
  fieldUpdate: (fieldId: string) => `${getBaseUrl()}/fields/update/${fieldId}`,
  cohortUpdate: (cohortId: string) => `${getBaseUrl()}/cohort/update/${cohortId}`,
  get notificationSend() { return `${getBaseUrl()}/notification/send`; },
  // tenantRead: `${baseurl}/tenant/read`,
  get tenantCreate() { return `${getBaseUrl()}/tenant/create`; },
  tenantUpdate: (tenantId: string) => `${getBaseUrl()}/tenant/update/${tenantId}`,
  tenantDelete: (tenantId: string) => `${getBaseUrl()}/tenant/delete/${tenantId}`,
  get tenantSearch() { return `${getBaseUrl()}/tenant/search`; },
  get userList() { return `${getBaseUrl()}/user/list`; },
  get cohortMemberList() { return `${getBaseUrl()}/cohortmember/list`; },
  userRead: (userId: string | string[], fieldValue: boolean) =>
    `${getBaseUrl()}/user/read/${userId}?fieldvalue=${fieldValue}`,
  get suggestUsername() { return `${getBaseUrl()}/user/suggestUsername`; },
  cohortUpdateUser: (userId?: string) => `${getBaseUrl()}/cohort/update/${userId}`,
  formReadWithContext: (context: string, contextType: string) =>
    `${getBaseUrl()}/form/read?context=${context}&contextType=${contextType}`,
  get cohortCreate() { return `${getBaseUrl()}/cohort/create`; },
  get cohortMemberBulkCreate() { return `${getBaseUrl()}/cohortmember/bulkCreate`; },
  cohortMemberUpdate: (membershipId: string | number) =>
    `${getBaseUrl()}/cohortmember/update/${membershipId}`,
  get notificationTemplate() { return `${getBaseUrl()}/notification-templates`; },
  get courseStatus() { return `${getBaseUrl()}/tracking/user_certificate/user_course_status`; },
  get courseWiseLernerList() { return `${getBaseUrl()}/tracking/user_certificate/status/search`; },
  get getCourseName() { return `${getBaseUrl()}/action/composite/v3/search`; },
  get issueCertificate() { return `${getBaseUrl()}/tracking/certificate/issue`; },
  get renderCertificate() { return `${getBaseUrl()}/tracking/certificate/render`; },
  get downloadCertificate() { return `${getBaseUrl()}/tracking/certificate/render-PDF`; },
};

export const getCoursePlannerUploadEndpoints = () => `${getEnvValue('NEXT_PUBLIC_BASE_URL') || ''}/prathamservice/v1/course-planner/upload`;

export const getTargetSolutionEndpoints = () => `${getEnvValue('NEXT_PUBLIC_COURSE_PLANNER_API_URL') || ''}/solutions/targetedSolutions?type=improvementProject&currentScopeOnly=true`;
