'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from '@mui/material';
import { fetchTermsAndConditions } from '../../services/LoginService';
import {
  performRedirect,
  checkUserAcceptedTerms,
  updateUserAcceptedTerms,
  extractAndStoreUrlParams,
} from '../../utils/Helper';
import { useTranslation } from 'react-i18next';
import { getTermsI18nText } from '../../constants/languages';
import { translatePipe, formatMarkdownContent } from '../../utils/translatePipe';

/**
 * Sanitizes HTML content using native browser DOMParser to strip unsafe elements
 * (scripts, iframes, objects, embeds, forms) and dangerous attributes (on*, javascript:).
 * Zero extra dependencies required.
 */
function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  if (typeof window === 'undefined') {
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // Remove potentially harmful elements
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'link', 'style', 'base'];
    dangerousTags.forEach((tag) => {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    });

    // Remove inline event handlers and unsafe schemes
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (
          name.startsWith('on') ||
          value.startsWith('javascript:') ||
          value.startsWith('vbscript:') ||
          value.startsWith('data:text/html')
        ) {
          el.removeAttribute(attr.name);
        }
      });
    });

    return doc.body.innerHTML;
  } catch (e) {
    console.error('Error sanitizing HTML:', e);
    return rawHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
}

interface CtaItem {
  label: Record<string, string> | string;
  type?: string;
  value: boolean;
}

interface TermsPolicyData {
  title?: Record<string, string> | string;
  heading?: Record<string, string> | string;
  content?: Record<string, { text?: string } | string> | string;
  cta?: CtaItem[];
}

function extractPolicyFields(response: any): TermsPolicyData | null {
  if (!response) return null;

  const candidates = [
    response?.result?.data?.fields,
    response?.data?.fields,
    response?.result?.fields,
    response?.fields,
    response?.result?.data,
    response?.data?.data,
    response?.data,
    response?.result,
    response,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === 'object' &&
      (candidate.content || candidate.cta)
    ) {
      return candidate;
    }
  }

  return null;
}

function TermsAndConditionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<TermsPolicyData | null>(null);
  const [hasDeclined, setHasDeclined] = useState(false);
  const [isAgreeing, setIsAgreeing] = useState(false);

  // Dynamic branding theming colors from localStorage
  const [themeColors, setThemeColors] = useState({
    primary: '#572E91',
    secondary: '#FF9911',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pColor = localStorage.getItem('primaryColor');
      const sColor = localStorage.getItem('secondaryColor');
      if (pColor || sColor) {
        setThemeColors({
          primary: pColor || '#572E91',
          secondary: sColor || '#FF9911',
        });
      }
    }
  }, []);

  // Active language state
  const initialLang = useMemo(() => {
    if (typeof window === 'undefined') return 'en';
    const queryLang = searchParams.get('preferred_language') || searchParams.get('lang');
    if (queryLang) {
      const normalized = queryLang.trim().toLowerCase();
      localStorage.setItem('preferred_language', normalized);
      localStorage.setItem('preferredLanguage', normalized);
      localStorage.setItem('lang', normalized);
      if (i18n && typeof i18n.changeLanguage === 'function' && i18n.language !== normalized) {
        i18n.changeLanguage(normalized);
      }
      return normalized;
    }
    const storedLang =
      localStorage.getItem('preferredLanguage') ||
      localStorage.getItem('preferred_language') ||
      localStorage.getItem('lang');
    if (storedLang) return storedLang.toLowerCase();
    return 'en';
  }, [searchParams, i18n]);

  const [currentLang, setCurrentLang] = useState<string>(initialLang);

  useEffect(() => {
    if (initialLang && initialLang !== currentLang) {
      setCurrentLang(initialLang);
    }
  }, [initialLang]);

  // Block direct access unless the authenticated tenant requires terms and the
  // user has not already accepted them; this prevents duplicate acceptance.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    extractAndStoreUrlParams();

    const accToken = localStorage.getItem('accToken');
    if (!accToken) {
      router.replace('/');
      return;
    }

    const hasTnC = localStorage.getItem('has_terms_and_conditions') === 'true';
    if (!hasTnC) {
      router.replace('/home');
      return;
    }

    // Check if the user has already accepted terms in their profile
    const verifyAndLoadTerms = async () => {
      try {
        setLoading(true);
        const alreadyAccepted = await checkUserAcceptedTerms(accToken);
        if (alreadyAccepted) {
          localStorage.setItem('has_accepted_terms_and_conditions', 'true');
          const refToken = localStorage.getItem('refToken') || undefined;
          performRedirect(accToken, router, '/home', refToken);
          return;
        }
      } catch (err) {
        console.error('Error verifying terms acceptance status:', err);
      }
      loadPolicy();
    };

    verifyAndLoadTerms();
  }, [router]);

  const loadPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasDeclined(false);

      const response = await fetchTermsAndConditions();
      const fields = extractPolicyFields(response);

      if (!fields || (!fields.content && !fields.cta)) {
        throw new Error(getTermsI18nText('noContentError', currentLang));
      }

      setPolicyData(fields);
    } catch (err: any) {
      console.error('Failed to load terms and conditions:', err);
      setError(getTermsI18nText('loadingError', currentLang));
    } finally {
      setLoading(false);
    }
  };


  const handleAgree = async () => {
    if (isAgreeing) return;
    setIsAgreeing(true);
    const accToken = localStorage.getItem('accToken') || '';
    const refToken = localStorage.getItem('refToken') || undefined;

    try {
      if (accToken) {
        await updateUserAcceptedTerms(accToken);
      }
    } catch (err) {
      console.error('Error updating terms acceptance:', err);
    } finally {
      localStorage.setItem('has_accepted_terms_and_conditions', 'true');

      // Check if CTA config from form read defines a url / route
      const ctaUrl = (agreeCta as any)?.url || (agreeCta as any)?.route;
      if (ctaUrl) {
        const targetRoute = ctaUrl.startsWith('/') ? ctaUrl : `/${ctaUrl}`;
        router.replace(targetRoute);
      } else {
        await performRedirect(accToken, router, '/home', refToken);
      }
    }
  };

  const handleDecline = () => {
    setHasDeclined(true);
    // TODO: Implement final decline behavior when product requirement is specified
  };

  // The form-read API supplies the title within its fields object. Older
  // policies may use heading, so retain it as a compatibility fallback.
  const heading = useMemo(() => {
    const apiTitle = translatePipe(
      policyData?.title ?? policyData?.heading,
      currentLang,
      ''
    );
    return (apiTitle || getTermsI18nText('termsAndConditions', currentLang))
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .trim();
  }, [policyData, currentLang]);

  // Sanitized & Markdown-formatted HTML content through translatePipe
  const sanitizedContent = useMemo(() => {
    if (!policyData?.content) return '';
    const rawContent = translatePipe(policyData.content, currentLang, '');
    const markdownFormatted = formatMarkdownContent(rawContent);
    return sanitizeHtml(markdownFormatted);
  }, [policyData, currentLang]);

  // CTAs
  const { agreeCta, declineCta } = useMemo(() => {
    const ctas = policyData?.cta && Array.isArray(policyData.cta) ? policyData.cta : [];
    const agree = ctas.find((c) => c.value === true) || {
      label: '',
      type: 'button',
      value: true,
    };
    const decline = ctas.find((c) => c.value === false) || null;
    return { agreeCta: agree, declineCta: decline };
  }, [policyData]);

  const agreeLabel = useMemo(() => {
    const custom = translatePipe(agreeCta?.label, currentLang, '');
    return custom || getTermsI18nText('accept', currentLang);
  }, [agreeCta, currentLang]);

  const declineLabel = useMemo(() => {
    const custom = translatePipe(declineCta?.label, currentLang, '');
    return custom || getTermsI18nText('decline', currentLang);
  }, [declineCta, currentLang]);

  const theme = createTheme({
    typography: {
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            backgroundColor: '#f3f4f6',
            overflow: 'hidden',
          },
          html: {
            overflow: 'hidden',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Background with ambient branded mesh gradient */}
      <Box
        sx={{
          minHeight: '100dvh',
          height: { xs: '100dvh', sm: 'auto' },
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: {
            xs: '#ffffff',
            sm: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          },
          p: { xs: 0, sm: 3, md: 4 },
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            display: { xs: 'none', sm: 'block' },
            content: '""',
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${themeColors.primary}18 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          },
          '&::after': {
            display: { xs: 'none', sm: 'block' },
            content: '""',
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${themeColors.secondary}22 0%, transparent 70%)`,
            filter: 'blur(60px)',
            pointerEvents: 'none',
          },
        }}
      >
        {loading && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: { xs: 0, sm: '24px' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2.5,
              bgcolor: '#ffffff',
              boxShadow: { xs: 'none', sm: '0 20px 40px rgba(0, 0, 0, 0.08)' },
              border: { xs: 'none', sm: '1px solid rgba(226, 232, 240, 0.8)' },
              position: 'relative',
              zIndex: 1,
              width: { xs: '100%', sm: 'auto' },
              height: { xs: '100dvh', sm: 'auto' },
            }}
          >
            <CircularProgress sx={{ color: themeColors.primary }} size={42} />
            <Typography
              sx={{ color: '#475569', fontSize: '15px', fontWeight: 500 }}
            >
              {getTermsI18nText('loading', currentLang)}
            </Typography>
          </Paper>
        )}

        {!loading && error && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: '24px',
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              bgcolor: '#ffffff',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={loadPolicy}
              sx={{
                bgcolor: themeColors.primary,
                color: '#fff',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '12px',
                px: 4,
                py: 1.2,
                boxShadow: `0 4px 14px ${themeColors.primary}33`,
                '&:hover': {
                  bgcolor: themeColors.primary,
                  filter: 'brightness(1.08)',
                },
              }}
            >
              {getTermsI18nText('retry', currentLang)}
            </Button>
          </Paper>
        )}

        {!loading && !error && (
          <Paper
            elevation={0}
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: { xs: '100%', sm: '860px', md: '980px', lg: '1040px' },
              borderRadius: { xs: 0, sm: '24px' },
              bgcolor: '#ffffff',
              boxShadow: {
                xs: 'none',
                sm: '0 20px 45px -12px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              },
              display: 'flex',
              flexDirection: 'column',
              height: { xs: '100dvh', sm: 'auto' },
              maxHeight: { xs: '100dvh', sm: '92vh', md: '88vh' },
              boxSizing: 'border-box',
              overflow: 'hidden',
              minWidth: 0,
              border: { xs: 'none', sm: '1px solid rgba(226, 232, 240, 0.8)' },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: { xs: 2, sm: 3.5, md: 4 },
                pb: { xs: 1.5, sm: 2.25 },
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
                bgcolor: '#ffffff',
                flexShrink: 0,
                boxShadow: '0 3px 10px rgba(15, 23, 42, 0.06)',
                position: 'relative',
                zIndex: 2,
              }}
            >
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '16.5px', sm: '20px' },
                  color: '#0f172a',
                  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
                  letterSpacing: '-0.3px',
                  lineHeight: 1.25,
                }}
              >
                {heading}
              </Typography>
            </Box>

            {/* Scrollable Terms Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                minWidth: 0,
                mx: { xs: 0, sm: 3.5, md: 4 },
                my: { xs: 0, sm: 1.5 },
                p: { xs: 2.25, sm: 3.5, md: 4 },
                borderRadius: { xs: 0, sm: '16px' },
                bgcolor: { xs: '#ffffff', sm: '#f8fafc' },
                border: { xs: 'none', sm: '1px solid #f1f5f9' },
                fontSize: { xs: '14px', sm: '14.5px', md: '15px' },
                lineHeight: 1.8,
                color: '#334155',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                // Custom slim scrollbar
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f3f4f6',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#d1d5db',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#9ca3af',
                },
                // Typography elements inside HTML content
                '& p': {
                  margin: '0 0 14px 0',
                },
                '& strong, & b': {
                  color: '#111827',
                  fontWeight: 700,
                },
                '& h1, & h2, & h3, & h4': {
                  color: '#111827',
                  fontWeight: 700,
                  fontSize: '15.5px',
                  margin: '16px 0 8px 0',
                },
                '& ul, & ol': {
                  margin: '8px 0 14px 0',
                  paddingLeft: '22px',
                },
                '& li': {
                  marginBottom: '6px',
                },
                '& img, & video, & iframe': {
                  maxWidth: '100%',
                  height: 'auto',
                },
                '& table': {
                  width: '100% !important',
                  maxWidth: '100%',
                  tableLayout: 'fixed',
                  wordBreak: 'break-word',
                },
                '& pre, & code': {
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                },
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Bottom Actions Footer */}
            <Box
              sx={{
                p: { xs: 2, sm: 3.5, md: 4 },
                pt: { xs: 1.5, sm: 2 },
                pb: {
                  xs: 'calc(14px + env(safe-area-inset-bottom, 0px))',
                  sm: 3.5,
                  md: 4,
                },
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                bgcolor: '#ffffff',
                boxShadow: {
                  xs: '0 -3px 10px rgba(15, 23, 42, 0.06)',
                  sm: '0 -3px 10px rgba(15, 23, 42, 0.05)',
                },
                flexShrink: 0,
                zIndex: 2,
              }}
            >
              {/* Warning Message if declined */}
              {hasDeclined && (
                <Alert
                  severity="warning"
                  sx={{ mb: 1, borderRadius: '12px', fontSize: '13px' }}
                >
                  {getTermsI18nText('declineWarning', currentLang)}
                </Alert>
              )}

              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1.25, sm: 1.75 },
                  width: '100%',
                  justifyContent: { xs: 'stretch', sm: 'flex-end' },
                  alignItems: 'center',
                }}
              >
                {/* Decline Option */}
                {declineCta && (
                  <Button
                    variant="outlined"
                    onClick={handleDecline}
                    sx={{
                      flex: { xs: 1, sm: '0 0 auto' },
                      minWidth: { sm: '150px' },
                      borderRadius: '12px',
                      py: 1.2,
                      px: { xs: 2, sm: 3 },
                      fontSize: { xs: '14px', sm: '14.5px' },
                      fontWeight: 600,
                      textTransform: 'none',
                      color: '#64748b',
                      borderColor: '#cbd5e1',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: '#f8fafc',
                        color: '#334155',
                      },
                    }}
                  >
                    {declineLabel}
                  </Button>
                )}

                {/* Accept Button */}
                <Button
                  variant="contained"
                  onClick={handleAgree}
                  disabled={isAgreeing}
                  fullWidth={!declineCta}
                  sx={{
                    flex: { xs: declineCta ? 1.5 : 1, sm: '0 0 auto' },
                    minWidth: { sm: declineCta ? '180px' : '220px' },
                    borderRadius: '12px',
                    py: 1.2,
                    px: { xs: 2.5, sm: 3.5 },
                    fontSize: { xs: '14px', sm: '14.5px' },
                    fontWeight: 600,
                    textTransform: 'none',
                    bgcolor: themeColors.primary,
                    color: '#ffffff',
                    boxShadow: `0 4px 14px ${themeColors.primary}33`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: themeColors.primary,
                      filter: 'brightness(1.08)',
                      boxShadow: `0 6px 18px ${themeColors.primary}45`,
                    },
                    '&.Mui-disabled': {
                      bgcolor: themeColors.primary,
                      opacity: 0.7,
                      color: '#ffffff',
                    },
                  }}
                >
                  {isAgreeing ? (
                    <CircularProgress size={20} sx={{ color: '#ffffff' }} />
                  ) : (
                    agreeLabel
                  )}
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default function TermsAndConditionsPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#eef0f3',
          }}
        >
          <CircularProgress sx={{ color: '#572E91' }} />
        </Box>
      }
    >
      <TermsAndConditionsContent />
    </Suspense>
  );
}
