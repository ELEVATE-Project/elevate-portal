import axios, { AxiosRequestConfig } from 'axios';
import { getEnvValue } from '@shared-lib';

export const trackingData = (subIds: string[], courseIds: string[]) => {
  const data = JSON.stringify({
    userId: subIds,
    courseId: courseIds,
  });

  const trackingApiUrl = getEnvValue('NEXT_PUBLIC_CONTENT_BASE_URL');

  if (!trackingApiUrl) {
    console.error('Tracking API URL is not defined in environment variables.');
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }
  const config: AxiosRequestConfig = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${trackingApiUrl}/interface/v1/tracking/user_certificate/status/search`,
    headers: {
      'Content-Type': 'application/json',
      tenantId: localStorage.getItem('tenantId') ?? 'ebae40d1-b78a-4f73-8756-df5e4b060436',
      Authorization: `Bearer ${localStorage.getItem('accToken') ?? ''}`,
    },
    data,
  };

  return axios
    .request(config)
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      console.error('Error in tracking API:', error);
      throw error;
    });
};
