'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
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
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import HeadphonesOutlinedIcon from '@mui/icons-material/HeadphonesOutlined';
import { fetchTermsAndConditions } from '../../services/LoginService';
import {
  performRedirect,
  checkUserAcceptedTerms,
  updateUserAcceptedTerms,
  extractAndStoreUrlParams,
} from '../../utils/Helper';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_LABELS,
  getTermsI18nText,
} from '../../constants/languages';
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
  heading?: Record<string, string> | string;
  content?: Record<string, { text?: string } | string> | string;
  needAudio?: boolean;
  audioFile?: Record<string, string>;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAgreeing, setIsAgreeing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Load tenant & execute route guards
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

  // Derive available languages from content keys (fallback to en, hi)
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>(['en', 'hi']);
    if (policyData?.content && typeof policyData.content === 'object') {
      Object.keys(policyData.content).forEach((key) => langs.add(key.toLowerCase()));
    }
    if (policyData?.audioFile && typeof policyData.audioFile === 'object') {
      Object.keys(policyData.audioFile).forEach((key) => langs.add(key.toLowerCase()));
    }
    return Array.from(langs).map((code) => ({
      code,
      label: LANGUAGE_LABELS[code] || code.toUpperCase(),
    }));
  }, [policyData]);

  // Handle language switch
  const handleLanguageChange = (newLang: string) => {
    setCurrentLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLanguage', newLang);
    }
    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(newLang);
    }
    // Stop audio on language change
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleAgree = async () => {
    if (isAgreeing) return;
    setIsAgreeing(true);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
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

  // Audio Play / Pause toggle
  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Audio playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  // Heading with translation pipe and i18n fallback
  const heading = useMemo(() => {
    const apiHeading = translatePipe(policyData?.heading, currentLang, '');
    return apiHeading || getTermsI18nText('termsAndConditions', currentLang);
  }, [policyData, currentLang]);

  // Sanitized & Markdown-formatted HTML content through translatePipe
  const sanitizedContent = useMemo(() => {
    if (!policyData?.content) return '';
    const rawContent = translatePipe(policyData.content, currentLang, '');
    const markdownFormatted = formatMarkdownContent(rawContent);
    return sanitizeHtml(markdownFormatted);
  }, [policyData, currentLang]);

  // Audio source with translation pipe
  const audioSrc = useMemo(() => {
    if (policyData?.needAudio === false) return null;
    if (!policyData?.audioFile) return null;
    return translatePipe(policyData.audioFile, currentLang, '') || null;
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
          minHeight: '100vh',
          width: '100vw',
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
          overflow: { xs: 'hidden', sm: 'hidden' },
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
              height: { xs: '100vh', sm: 'auto' },
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
              height: { xs: '100vh', sm: 'auto' },
              maxHeight: { xs: '100dvh', sm: '92vh', md: '88vh' },
              boxSizing: 'border-box',
              overflow: 'hidden',
              border: { xs: 'none', sm: '1px solid rgba(226, 232, 240, 0.8)' },
            }}
          >
            {/* Top Dual-Brand Gradient Accent Bar */}
            <Box
              sx={{
                height: '5px',
                width: '100%',
                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                flexShrink: 0,
              }}
            />

            {/* Hidden HTML5 Audio Element */}
            {audioSrc && (
              <audio
                ref={audioRef}
                src={audioSrc}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
              />
            )}

            {/* Header: Branded Icon + Title + Language Selector */}
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
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 1.75 } }}>
                <Box
                  sx={{
                    width: { xs: 38, sm: 44 },
                    height: { xs: 38, sm: 44 },
                    borderRadius: '12px',
                    bgcolor: `${themeColors.primary}12`,
                    color: themeColors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${themeColors.primary}15`,
                  }}
                >
                  <VerifiedUserOutlinedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Box>
                <Box>
                  <Typography
                    variant="h6"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '16.5px', sm: '20px' },
                      color: '#0f172a',
                      letterSpacing: '-0.3px',
                      lineHeight: 1.25,
                    }}
                  >
                    {heading}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748b',
                      fontSize: { xs: '11.5px', sm: '12.5px' },
                      fontWeight: 500,
                      display: 'block',
                      mt: 0.25,
                    }}
                  >
                    Please review our terms & guidelines
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Audio Narration Card */}
            {policyData?.needAudio !== false && audioSrc && (
              <Box
                sx={{
                  mx: { xs: 2, sm: 3.5, md: 4 },
                  mt: { xs: 1.5, sm: 2 },
                  mb: { xs: 0.5, sm: 1 },
                  p: { xs: 1.25, sm: 2 },
                  borderRadius: { xs: '12px', sm: '16px' },
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: { xs: 1.25, sm: 2 },
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#cbd5e1',
                    bgcolor: '#f1f5f9',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '10px',
                      bgcolor: isPlaying
                        ? `${themeColors.secondary}20`
                        : `${themeColors.primary}12`,
                      color: isPlaying
                        ? themeColors.secondary
                        : themeColors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <HeadphonesOutlinedIcon sx={{ fontSize: 20 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {getTermsI18nText('listenToTerms', currentLang)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '11.5px',
                        color: isPlaying ? themeColors.primary : '#64748b',
                        fontWeight: 500,
                      }}
                    >
                      {isPlaying
                        ? 'Playing audio narration...'
                        : 'Listen in your preferred language'}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  onClick={handleToggleAudio}
                  disabled={!audioSrc}
                  startIcon={
                    isPlaying ? (
                      <PauseIcon sx={{ fontSize: '17px !important' }} />
                    ) : (
                      <PlayArrowIcon sx={{ fontSize: '17px !important' }} />
                    )
                  }
                  sx={{
                    borderRadius: '20px',
                    bgcolor: isPlaying
                      ? themeColors.secondary
                      : themeColors.primary,
                    color: '#ffffff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '13px',
                    px: 2.25,
                    py: 0.6,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${
                      isPlaying ? themeColors.secondary : themeColors.primary
                    }33`,
                    '&:hover': {
                      bgcolor: isPlaying
                        ? themeColors.secondary
                        : themeColors.primary,
                      filter: 'brightness(1.08)',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#e2e8f0',
                      color: '#94a3b8',
                    },
                  }}
                >
                  {isPlaying
                    ? getTermsI18nText('pause', currentLang)
                    : getTermsI18nText('play', currentLang)}
                </Button>
              </Box>
            )}

            {/* Scrollable Terms Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                mx: { xs: 0, sm: 3.5, md: 4 },
                my: { xs: 0, sm: 1.5 },
                p: { xs: 2.25, sm: 3.5, md: 4 },
                borderRadius: { xs: 0, sm: '16px' },
                bgcolor: { xs: '#ffffff', sm: '#f8fafc' },
                border: { xs: 'none', sm: '1px solid #f1f5f9' },
                fontSize: { xs: '14px', sm: '14.5px', md: '15px' },
                lineHeight: 1.8,
                color: '#334155',
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
                  xs: '0 -4px 18px rgba(0, 0, 0, 0.06)',
                  sm: 'none',
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

              <Typography
                variant="caption"
                sx={{
                  textAlign: { xs: 'center', sm: 'right' },
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  mt: 0.25,
                }}
              >
                By proceeding, you agree to our Terms of Service & Privacy Policy.
              </Typography>
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
