import { getBranding } from '../utils/branding';
import I18nProvider from '../Components/I18nProvider';

export async function generateMetadata() {
  const { appName, logo } = await getBranding();

  return {
	// manifest: '/manifest.json',
    title: `Welcome to ${appName}`,
    icons: { icon: logo, apple: logo },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="/env-config.js" defer></script>
         <style
          dangerouslySetInnerHTML={{
            __html: `
						/* Base resets & typography */
						body, html {
							margin: 0;
							padding: 0;
							box-sizing: border-box;
							font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
						}
						button, input, select, textarea {
							font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
						}
						/* MUI components declare a font of their own, which otherwise
						 * prevents them from inheriting the application font. Keep the
						 * typography consistent across every route and dialog. */
						.MuiTypography-root,
						.MuiButton-root,
						.MuiInputBase-input,
						.MuiInputLabel-root,
						.MuiFormHelperText-root,
						.MuiMenuItem-root,
						.MuiSelect-select,
						.MuiChip-label {
							font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
						}
						/* Dynamic RJSF widgets are shared by login, registration and
						 * account. Their desktop defaults are deliberately compact; make
						 * their tap targets and text readable on phones. */
						@media (max-width: 599.95px) {
							.MuiInputBase-root.MuiOutlinedInput-root,
							.MuiSelect-root.MuiOutlinedInput-root {
								min-height: 48px !important;
							}
							.MuiInputBase-input,
							.MuiSelect-select {
								font-size: 16px !important;
								padding-top: 12px !important;
								padding-bottom: 12px !important;
							}
							.MuiInputLabel-root {
								font-size: 14px !important;
							}
							.MuiFormHelperText-root {
								font-size: 12px !important;
							}
						}
						*, *:before, *:after { box-sizing: inherit; }

						/* Prevent viewport resizing quirks on iOS */
						body {
							-webkit-text-size-adjust: 100%;
							-webkit-tap-highlight-color: transparent;
						}

						/* Allow text selection in form fields */
						input, textarea, select {
							-webkit-user-select: text;
							user-select: text;
							-webkit-appearance: none;
							border-radius: 0;
						}

						/* MUI label: ensure no strikethrough and sits above underline */
						.MuiFormLabel-root { text-decoration: none !important; text-decoration-skip-ink: none !important; position: relative; z-index: 2; }
						/* If background bleed causes line-through, give label a background */
						.MuiFormLabel-root.MuiInputLabel-shrink { background-color: #fff !important; padding: 0 4px; }

						/* iOS-only: prevent auto-zoom by making inputs/selects compute to >=16px */
						html.is-ios .MuiInputBase-input,
						html.is-ios .MuiOutlinedInput-input,
						html.is-ios .MuiFilledInput-input,
						html.is-ios .MuiSelect-select,
						html.is-ios input,
						html.is-ios select,
						html.is-ios textarea { font-size: 16px !important; }

						/* Keep outlines/underlines stable and behind label */
						.MuiInput-underline:before, .MuiInput-underline:after { transform: none; }
						html.is-ios .MuiOutlinedInput-notchedOutline { z-index: 1; }
						html.is-ios .MuiInputLabel-root { z-index: 2; }
          `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
						(function() {
							try {
								var ua = window.navigator.userAgent || '';
								var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
								if (iOS) {
									document.documentElement.classList.add('is-ios');
									// Prevent zoom on focus by reinforcing viewport
									var meta = document.querySelector('meta[name="viewport"]');
									if (!meta) return;
									var base = meta.getAttribute('content') || '';
									document.addEventListener('focusin', function(e){
										var t = e.target;
										if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) {
											meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
										}
									});
									document.addEventListener('focusout', function(){
										meta.setAttribute('content', base || 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
									});
								}
							} catch(e) {}
						})();
					`,
          }}
        />
      </head>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
