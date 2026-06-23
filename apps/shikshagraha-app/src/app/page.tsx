/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  ButtonBase,
  Snackbar,
  Tabs,
  Tab,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  authenticateLoginUser,
  fetchTenantData,
  signin,
  fetchBranding,
  loginSchemaRead,
  sendOtp,
} from '../services/LoginService';
import AppConst from '../utils/AppConst/AppConst';
import { setAccessTokenCookie, performRedirect, getAutoRegister, getAllowedAuthMode } from '../utils/Helper';
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import CustomTextFieldWidget from '../Components/RJSFWidget/CustomTextFieldWidget';
import OTPDialog from '../Components/OTPDialog';
import { ALLOWED_AUTH_MODES, DEFAULT_LOGIN_FIELDS } from '../utils/app.constant';
import { generateRJSFSchema } from '../utils/generateSchemaFromAPI';
export default function Login() {
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<any>({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [readOnly, setReadOnly] = useState(true);
  const queryRouter = useSearchParams();
  const router = useRouter();
  const unAuth = queryRouter.get('unAuth');
  const basePath = AppConst?.BASEPATH;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const loginClickedRef = useRef(false);
  const [logoSrc, setLogoSrc] = useState<string>('');
  const TRANSPARENT_PX =
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  // Dynamic branding config states
  const [availableAuthModes, setAvailableAuthModes] = useState<string[]>([]);
  const [selectedAuthMode, setSelectedAuthMode] = useState<string>('');
  const [formSchema, setFormSchema] = useState<any>(null);
  const [uiSchema, setUiSchema] = useState<any>(null);
  const [isAutoRegister, setIsAutoRegister] = useState(false);
  const [brandingFetched, setBrandingFetched] = useState(false);

  // OTPDialog states
  const [openOtpDialog, setOpenOtpDialog] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    const redirectUrl = queryRouter.get('redirectUrl');
    if (redirectUrl) {
      localStorage.setItem('redirectUrl', decodeURIComponent(redirectUrl));
    }
  }, [queryRouter]);

  useEffect(() => {
    const token = localStorage.getItem('accToken');
    const status = localStorage.getItem('userStatus');
    if (token && status !== 'archived') {
      performRedirect(token, router);
    }
    // Remove readonly after a short delay to prevent autofill
    const timer = setTimeout(() => {
      setReadOnly(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [router]);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const origin = window.location.origin;
      const parts = hostname.split('.');
      localStorage.setItem('origin', origin);
      const skipList = [
        'app',
        'www',
        'dev',
        'staging',
        'tekdinext',
        'org',
        'com',
        'net',
      ];
      // Step 1: Find the most likely base domain part
      const domainPart =
        parts.find((part) => !skipList.includes(part.toLowerCase())) ||
        'default';
      // Step 2: Remove suffixes like -qa, -dev, etc. if present
      const knownSuffixes = ['-qa', '-dev', '-staging'];
      let coreDomain = knownSuffixes.reduce((name, suffix) => {
        return name.endsWith(suffix) ? name.replace(suffix, '') : name;
      }, domainPart);

      // Pre-populate states with cached configuration before branding API loads
      const initialAutoRegister = getAutoRegister();
      const initialAllowedAuthModes = getAllowedAuthMode();
      setIsAutoRegister(initialAutoRegister);
      setAvailableAuthModes(initialAllowedAuthModes);
      if (initialAllowedAuthModes.length > 0) {
        setSelectedAuthMode((prev) => prev || initialAllowedAuthModes[0]);
      }
      fetchBranding(coreDomain)
        .then((brandingData) => {
        if (brandingData) {
          const tenantCode = brandingData?.result?.code;
          const apiLogo =
            brandingData?.result?.logo ||
            brandingData?.result?.logoUrl ||
            brandingData?.result?.branding?.logo;
          localStorage.setItem('tenantCode', tenantCode);
          setDisplayName(tenantCode);
            if (apiLogo && typeof apiLogo === 'string') {
              setLogoSrc(apiLogo);
              localStorage.setItem('brandingLogoUrl', apiLogo);
          }
            const configurations = brandingData?.result?.configurations || brandingData?.result?.branding?.configurations || {};
            const autoRegister = configurations.auto_register !== undefined ? configurations.auto_register : false;
            const allowedAuthMode = configurations.allowed_auth_mode;
 
            localStorage.setItem('auto_register', String(autoRegister));
            setIsAutoRegister(autoRegister);

            if (allowedAuthMode && Array.isArray(allowedAuthMode) && allowedAuthMode.length > 0) {
              localStorage.setItem('allowed_auth_mode', JSON.stringify(allowedAuthMode));
              setAvailableAuthModes(allowedAuthMode);
              setSelectedAuthMode((prev) => prev || allowedAuthMode[0]);
            } else {
              localStorage.removeItem('allowed_auth_mode');
              setAvailableAuthModes([]);
              setSelectedAuthMode(ALLOWED_AUTH_MODES.PASSWORD);
            }
          }
        })
        .catch((err) => {
          console.error('Error fetching branding:', err);
        })
        .finally(() => {
      const displayName = localStorage.getItem('tenantCode');
      if (displayName) {
        setDisplayName(displayName);
        const normalized = (displayName || '').toLowerCase();
        const TENANT_LOGOS: Record<string, string> = {
          shikshalokam: '/assets/images/SG_Logo.png',
          shikshagraha: '/assets/images/SG_Logo.jpg',
        };
        if (TENANT_LOGOS[normalized]) {
          setLogoSrc((prev) => prev || TENANT_LOGOS[normalized]);
        }
      }
          setBrandingFetched(true);
        });
    }
  }, []);

  // Fetch form schema from API dynamically
  useEffect(() => {
    const fetchSchema = async () => {
      const modeToFetch = selectedAuthMode || ALLOWED_AUTH_MODES.PASSWORD;
      setLoading(true);
      try {
        let fields = [];
        const hasAllowedAuthMode = typeof window !== 'undefined' && !!localStorage.getItem('allowed_auth_mode');
        if (hasAllowedAuthMode && selectedAuthMode) {
          try {
            const response = await loginSchemaRead(selectedAuthMode);
            const rawFields = response?.result?.data?.fields;
            fields = Array.isArray(rawFields) ? rawFields : (rawFields?.result ?? []);
          } catch (apiError) {
            console.error('Error fetching schema from API:', apiError);
          }
        }

        // Fallback schema if API returns nothing or fails
        if (fields.length === 0) {   
            fields = DEFAULT_LOGIN_FIELDS;
        }

        const { schema, uiSchema } = generateRJSFSchema(fields, '');
        if (schema) {
          if (schema.properties) {
            Object.keys(schema.properties).forEach((key) => {
              delete schema.properties[key].pattern;
            });
          }
          schema.required = [];
        }
        setFormSchema(schema);
        setUiSchema(uiSchema);
      } catch (err) {
        console.error('Error processing schema:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [selectedAuthMode]);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('accToken'));
  }, []);
  const handleButtonClick = async () => {
    if (formSubmitted) return; // Prevent duplicate submissions
    setFormSubmitted(true);
    setShowError(false);

    const userName = formData.userName || formData.username || formData.identifier || '';
    const password = formData.password || '';

    // If it's OTP mode, we send OTP instead of performing signin directly
    if (selectedAuthMode === ALLOWED_AUTH_MODES.OTP) {
      if (!userName) {
        setShowError(true);
        setErrorMessage('Identifier is required');
        setFormSubmitted(false);
        return;
      }
      setLoading(true);
      try {
        const isMobile = /^[6-9]\d{9}$/.test(userName);
        const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(userName);
        let otpPayload: any = {};
        if (isMobile) {
          otpPayload = {
            phone: userName,
            phone_code: '+91',
          };
        } else if (isEmail) {
          otpPayload = {
            email: userName
          };
        } else {
          otpPayload = {
            username: userName,
          };
        }
        const response = await sendOtp(otpPayload);
        if (response?.responseCode === 'OK') {
          setOtpError('');
          setOpenOtpDialog(true);
        } else {
          setShowError(true);
          setErrorMessage(response?.message || 'Failed to send OTP. Please try again.');
        }
      } catch (err) {
        setShowError(true);
        setErrorMessage(err.message || 'Error sending OTP');
      } finally {
        setLoading(false);
        setFormSubmitted(false);
      }
      return;
    }
    // Standard Password login flow
    if (!userName || !password) {
      setShowError(true);
      setErrorMessage('Username and password are required');
      setFormSubmitted(false);
      return;
    }
    setLoading(true);
    try {
      const isMobile = /^[6-9]\d{9}$/.test(userName);
      const payload = {
        username: userName,
        password,
        ...(isMobile ? { phone_code: '+91' } : {}),
      };
      const response = await signin(payload);
      const accessToken = response?.result?.access_token;
      const refreshToken = response?.result?.refresh_token;
      const userId = response?.result?.user?.id;
      if (accessToken) {
        const userStatus = response?.result?.user?.status;
        localStorage.setItem('userStatus', userStatus);
        document.cookie = `userStatus=${userStatus}; path=/; max-age=86400; secure; SameSite=Lax`;
        if (userStatus !== 'ACTIVE') {
          setShowError(true);
          setErrorMessage('The user is deactivated, please contact admin.');
          setLoading(false);
          setFormSubmitted(false);
          return;
        }
        const isRedirectActive = !!localStorage.getItem('redirectUrl');
        if (!isRedirectActive) {
        localStorage.setItem('accToken', accessToken);
        localStorage.setItem('refToken', refreshToken);
        localStorage.setItem('firstName', response?.result?.user?.name);
          localStorage.setItem('userId', response?.result?.user?.id);
          localStorage.setItem('name', response?.result?.user?.username);
        }
        let storedUserId = localStorage.getItem('userId');
        let userId = storedUserId ? Number(storedUserId) : response?.result?.user?.id;
        if (userId !== response?.result?.user?.id) {
          clearIndexedDB();
        }
        if (!isRedirectActive) {
          setAccessTokenCookie(accessToken);
          document.cookie = `accToken=${accessToken}; path=/; max-age=86400; secure; SameSite=Lax`;
          document.cookie = `userId=${userId}; path=/; max-age=86400; secure; SameSite=Lax`;
        }
        performRedirect(accessToken, router, '/home', refreshToken);
        const organizations = response?.result?.user?.organizations || [];
        const orgId = organizations[0]?.id;
        const frameworkId = organizations[0]?.meta?.framework?.node_id;
        if (orgId && !isRedirectActive) {
          localStorage.setItem(
            'headers',
            JSON.stringify({ 'org-id': orgId.toString() })
          );
        }
        if (frameworkId) {
          if (!isRedirectActive) {
          localStorage.setItem('frameworkId', frameworkId);
          }
          document.cookie = `frameworkId=${frameworkId}; path=/; max-age=86400; secure; SameSite=Lax`;
        }
      } else {
        setShowError(true);
        setErrorMessage(response?.response?.data?.message);
      }
    } catch (error) {
      setShowError(true);
      setErrorMessage(error?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
      setFormSubmitted(false);
    }
  };

  const handleOtpSubmit = async (otpString: string) => {
    setOtpLoading(true);
    setOtpError('');
    try {
      const identifier = formData.userName || formData.username || formData.identifier || '';
      const payload = {
        identifier: identifier,
        otp: otpString,
      };
      const response = await signin(payload);
      const accessToken = response?.result?.access_token;
      const refreshToken = response?.result?.refresh_token;
      const userId = response?.result?.user?.id;
      if (accessToken) {
        setOpenOtpDialog(false);
        const userStatus = response?.result?.user?.status;
        localStorage.setItem('userStatus', userStatus);
        document.cookie = `userStatus=${userStatus}; path=/; max-age=86400; secure; SameSite=Lax`;
        if (userStatus !== 'ACTIVE') {
          setOtpError('The user is deactivated, please contact admin.');
          return;
        }

        const isRedirectActive = !!localStorage.getItem('redirectUrl');
        if (!isRedirectActive) {
          localStorage.setItem('accToken', accessToken);
          localStorage.setItem('refToken', refreshToken);
          localStorage.setItem('firstName', response?.result?.user?.name);
          localStorage.setItem('userId', response?.result?.user?.id);
          localStorage.setItem('name', response?.result?.user?.username);
        }

        let storedUserId = localStorage.getItem('userId');
        let userId = storedUserId ? Number(storedUserId) : response?.result?.user?.id;
        if (userId !== response?.result?.user?.id) {
          clearIndexedDB();
        }

        if (!isRedirectActive) {
          setAccessTokenCookie(accessToken);
          document.cookie = `accToken=${accessToken}; path=/; max-age=86400; secure; SameSite=Lax`;
          document.cookie = `userId=${userId}; path=/; max-age=86400; secure; SameSite=Lax`;
        }
        performRedirect(accessToken, router, '/home', refreshToken);

        const organizations = response?.result?.user?.organizations || [];
        const orgId = organizations[0]?.id;
        const frameworkId = organizations[0]?.meta?.framework?.node_id;
        if (orgId && !isRedirectActive) {
          localStorage.setItem(
            'headers',
            JSON.stringify({ 'org-id': orgId.toString() })
          );
        }
        if (frameworkId) {
          if (!isRedirectActive) {
            localStorage.setItem('frameworkId', frameworkId);
          }
          document.cookie = `frameworkId=${frameworkId}; path=/; max-age=86400; secure; SameSite=Lax`;
        }
      } else {
        setOtpError(response?.response?.data?.message || 'Verification failed. Invalid OTP.');
      }
    } catch (error) {
      setOtpError(error?.message ?? 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const identifier = formData.userName || formData.username || formData.identifier || '';
    if (!identifier) return;
    const isMobile = /^[6-9]\d{9}$/.test(identifier);
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(identifier);
    let otpPayload: any = {};
    if (isMobile) {
      otpPayload = {
        phone: identifier,
        phone_code: '+91',
      };
    } else if (isEmail) {
      otpPayload = {
        email: identifier,
      };
    } else {
      otpPayload = {
        username: identifier,
      };
    }
    await sendOtp(otpPayload);
  };

  function clearIndexedDB() {
    indexedDB
      .databases()
      .then((databases) => {
        databases.forEach((database) => {
          const deleteRequest = indexedDB.deleteDatabase(database.name);

          deleteRequest.onsuccess = () => {
            console.log(`Database "${database.name}" deleted successfully.`);
          };

          deleteRequest.onerror = (event) => {
            console.error(
              `Error deleting database "${database.name}":`,
              event.target.error
            );
          };

          deleteRequest.onblocked = () => {
            console.warn(`Database "${database.name}" deletion is blocked.`);
          };
        });
      })
      .catch((error) => {
        console.error('Error retrieving databases:', error);
      });
  }

  const handleRegisterClick = () => {
    const redirectUrl = queryRouter.get('redirectUrl');
    if (redirectUrl) {
      router.replace(`/register?redirectUrl=${encodeURIComponent(redirectUrl)}`);
    } else {
      router.replace('/register');
    }
  };
  const handlePasswordClick = () => {
    router.push('/forgetpassword');
  };
  const remoteUnAuthToaster = () => {
    router.push('/');
  };

  const showForgotPassword = !availableAuthModes.length || availableAuthModes.includes(ALLOWED_AUTH_MODES.PASSWORD);

  const widgets = React.useMemo(
    () => ({
      password: (props: any) => (
        <CustomTextFieldWidget
          {...props}
          formContext={{ isLogin: true }}
        />
      ),
      CustomTextFieldWidget: (props: any) => (
        <CustomTextFieldWidget
          {...props}
          formContext={{ isLogin: true }}
        />
      ),
    }),
    []
  );

  const transformErrors = React.useCallback((errors: any[]) => {
    return errors.map((error) => {
      if (error.name === 'pattern') {
        const prop = error.property ? error.property.toLowerCase() : '';
        if (
          prop.includes('username') ||
          prop.includes('identifier') ||
          prop.includes('name') ||
          prop.includes('email') ||
          prop.includes('phone')
        ) {
          error.message = 'Please enter a valid Email or Phone Number';
          error.stack = `${error.message}`;
        }
      }
      return error;
    });
  }, []);

  if (!brandingFetched) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #f5f5f5, #f5f5f5)',
          minHeight: '100vh',
          padding: 2,
        }}
      >
        <CircularProgress size={50} color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f5f5, #f5f5f5)',
        minHeight: '100vh',
        padding: 2,
      }}
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={50} color="primary" />
        </Box>
      )}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{
          maxWidth: { xs: '90%', sm: '400px', md: '500px' },
          bgcolor: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          borderRadius: '16px',
          padding: { xs: 2, sm: 3 },
          textAlign: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 'inherit',
            padding: '4px',
            background: 'linear-gradient(to right, #FF9911 50%, #582E92 50%)',
            WebkitMask:
              'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          },
        }}
      >
        <Box style={{ width: '100%' }}>
          {/* Hidden fields to trick Chrome's autofill */}
          <input
            type="text"
            name="prevent_autofill_username"
            style={{ display: 'none' }}
          />
          <input
            type="password"
            name="prevent_autofill_password"
            style={{ display: 'none' }}
          />
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              mb: 2,
              gap: 1,
            }}
          >
            <Box
              component="img"
              src={logoSrc || TRANSPARENT_PX}
              alt="logo"
              sx={{
                width: '30%',
                height: '30%',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </Box>

          {availableAuthModes.length > 1 && (
            <Tabs
              value={selectedAuthMode}
              onChange={(e, newMode) => {
                setSelectedAuthMode(newMode);
                setFormData({});
                setError({});
                setShowError(false);
              }}
              centered
              sx={{
                mb: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 'bold',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#582E92',
                },
                '& .Mui-selected': {
                  color: '#582E92 !important',
                },
              }}
            >
              {availableAuthModes.map((mode) => (
                <Tab
                  key={mode}
                  value={mode}
                  label={mode === ALLOWED_AUTH_MODES.OTP ? 'OTP' : 'Password'}
                />
              ))}
            </Tabs>
          )}

          {formSchema && (
            <Form
              schema={formSchema}
              uiSchema={uiSchema}
              validator={validator}
              widgets={widgets}
              transformErrors={transformErrors}
              formData={formData}
              onChange={({ formData }) => {
                setFormData(formData);
                setError({});
              }}
              onSubmit={() => {
                handleButtonClick();
              }}
              showErrorList={false}
              liveValidate={false}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                  mt: 2,
                }}
              >
                <Button
                  type="submit"
                  sx={{
                    bgcolor: '#582E92',
                    color: '#FFFFFF',
                    borderRadius: '30px',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '8px 16px',
                    '&:hover': {
                      bgcolor: '#543E98',
                    },
                    width: '50%',
                  }}
                >
                  {selectedAuthMode === ALLOWED_AUTH_MODES.OTP ? 'Get OTP' : 'Login'}
                </Button>
              </Box>
            </Form>
          )}

          {showForgotPassword && (
            <Typography variant="body2" textAlign="center" mt={2} color="#6B6B6B">
              <ButtonBase
                onClick={handlePasswordClick}
                sx={{
                  color: '#6750A4',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '15px',
                  marginTop: '10px',
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </ButtonBase>
            </Typography>
          )}

          {!isAutoRegister && (
            <Typography variant="body2" textAlign="center" mt={2} color="#6B6B6B">
              Don't have an account?{' '}
              <ButtonBase
                onClick={handleRegisterClick}
                sx={{
                  color: '#6750A4',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '15px',
                }}
              >
                Register
              </ButtonBase>
            </Typography>
          )}
          <Grid container justifyContent="center" alignItems="center" mt={2}>
            {showError && (
              <Alert severity="error">
                {typeof errorMessage === 'object'
                  ? JSON.stringify(errorMessage)
                  : errorMessage}
              </Alert>
            )}
            {unAuth && (
              <Snackbar
                open={true}
                autoHideDuration={3000}
                onClose={() => remoteUnAuthToaster(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
              >
                <Alert
                  severity="error"
                  onClose={() => remoteUnAuthToaster(false)}
                  sx={{ mt: 2 }}
                >
                  Your session has expired, Please login again.
                </Alert>
              </Snackbar>
            )}
          </Grid>
        </Box>
      </Grid>
      <OTPDialog
        open={openOtpDialog}
        onClose={() => {
          setOpenOtpDialog(false);
          setOtpError('');
        }}
        onSubmit={handleOtpSubmit}
        onResendOtp={handleResendOtp}
        loading={otpLoading}
        error={otpError}
        submitButtonText="Login"
      />
    </Box>
  );
}
