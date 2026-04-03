import { MetadataRoute } from 'next';
import { getBranding } from '../utils/branding';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { appName, logo } = await getBranding();

  const getMimeType = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'webp': return 'image/webp';
      case 'svg': return 'image/svg+xml';
      case 'ico': return 'image/x-icon';
      default: return 'image/png';
    }
  };

  const iconType = getMimeType(logo);

  return {
    name: appName,
    short_name: appName,
    description: `Welcome to ${appName}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1976d2',
    icons: [
      {
        src: logo,
        sizes: '192x192',
        type: iconType,
        purpose: 'any',
      },
      {
        src: logo,
        sizes: '512x512',
        type: iconType,
        purpose: 'any',
      },
    ],
  };
}