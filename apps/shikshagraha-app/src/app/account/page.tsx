'use client';
import { useEffect, useState, useRef } from 'react';
import { generateRJSFSchema } from '../../utils/generateSchemaFromAPI';
import DynamicForm from '../../Components/DynamicForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Grid,
  Typography,
  createTheme,
  ThemeProvider,
  CircularProgress,
  CssBaseline,
  IconButton,
} from '@mui/material';
import {
  fetchRoleData,
  getSubroles,
  schemaRead,
  fetchBranding,
} from '../../services/LoginService';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { extractAndStoreUrlParams } from '../../utils/Helper';
import { API_ENDPOINTS } from '../../utils/API/APIEndpoints';
import { FORM_CONFIG } from '../../constants/form';
import { translatePipe } from '../../utils/translatePipe';

const normaliseFieldKey = (value: unknown) =>
  String(value ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const getProfileFieldValue = (profile: Record<string, any>, field: any) => {
  const fieldKeys = [field?.name, field?.fieldId]
    .filter(Boolean)
    .map(normaliseFieldKey);

  const matchingProfileEntry = Object.entries(profile).find(
    ([key, value]) =>
      fieldKeys.includes(normaliseFieldKey(key)) &&
      value !== undefined &&
      value !== null
  );
  if (matchingProfileEntry) return matchingProfileEntry[1];

  const customFields = Array.isArray(profile.customFields)
    ? profile.customFields
    : [];
  const matchingCustomField = customFields.find((customField: any) =>
    [customField.fieldId, customField.name, customField.key]
      .filter(Boolean)
      .some((key) => fieldKeys.includes(normaliseFieldKey(key)))
  );

  return matchingCustomField?.value;
};

export default function Register() {
  const { i18n } = useTranslation();
  const [formSchema, setFormSchema] = useState<any>();
  const [uiSchema, setUiSchema] = useState<any>();
  const [loading, setLoading] = useState(true);
  const queryRouter = useSearchParams();

  const [isUpdate, setIsUpdate] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const searchParams = new URL(window.location.href).searchParams;
      const token =
        searchParams.get('accToken') ||
        searchParams.get('accessToken') ||
        searchParams.get('token') ||
        localStorage.getItem('accToken');
      return !!token;
    } catch {
      return false;
    }
  });
  const [prefilledFormData, setPrefilledFormData] = useState<any>({});
  const [formReadFields, setFormReadFields] = useState<any[]>([]);

  useEffect(() => {
    const params = extractAndStoreUrlParams();
    const token =
      params.accToken ||
      localStorage.getItem('accToken');
    if (token) {
      setIsUpdate(true);
    }
    const queryLang = localStorage.getItem('preferred_language');
    if (queryLang && i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(queryLang);
    }
  }, [queryRouter, i18n]);
  const [formData, setFormData] = useState();
  const [fieldNameToFieldIdMapping, setFieldNameToFieldIdMapping] = useState(
    {}
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [domain, setDomain] = useState<string>('');
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [subRoles, setSubRoles] = useState<any[]>([]);
  const previousRole = useRef<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [tenantConfigured, setTenantConfigured] = useState(false);

  // First useEffect: Initialize tenant configuration
  useEffect(() => {
    const initializeTenant = async () => {
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

        if (coreDomain === 'shikshagrah' || coreDomain === 'localhost' || coreDomain === '127.0.0.1' || coreDomain === 'default') {
          coreDomain = 'shikshagraha';
        }

        try {
          const brandingData = await fetchBranding(coreDomain);

          if (brandingData && brandingData.result) {
            const tenantCode = brandingData.result.code;
            const tenantId = brandingData.result.id;

            // Set both tenantCode and tenantId in localStorage
            localStorage.setItem('tenantCode', tenantCode);
            localStorage.setItem('tenantId', tenantId);

            const configurations = brandingData.result.configuration || brandingData.result.branding?.configuration || {};
            if (configurations.has_terms_and_conditions !== undefined) {
              localStorage.setItem('has_terms_and_conditions', String(configurations.has_terms_and_conditions === true));
            }

            const theming = brandingData.result.theming || brandingData.result.branding?.theming || {};
            if (theming.primaryColor) {
              localStorage.setItem('primaryColor', theming.primaryColor);
            }
            if (theming.secondaryColor) {
              localStorage.setItem('secondaryColor', theming.secondaryColor);
            }
            if (theming.primaryColor || theming.secondaryColor) {
              localStorage.setItem('theming', JSON.stringify({
                primaryColor: theming.primaryColor || '#572E91',
                secondaryColor: theming.secondaryColor || '#FF9911',
              }));
            }

            setDisplayName(toPascalCase(tenantCode));
            setTenantConfigured(true);
          } else {
            // Fallback for incognito mode or when branding fails
            console.warn(
              'Branding data not available, using fallback tenant configuration'
            );
          }
        } catch (error) {
          console.error('Error fetching branding:', error);
          // Fallback for incognito mode or when branding fails
          //remove fallback tenant configuration
        }
      }
    };

    initializeTenant();
  }, []);

  const toPascalCase = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/(^\w|[^a-zA-Z0-9]+(\w))/g, (_, first, second) =>
        (first || second).toUpperCase()
      );
  };

  // Second useEffect: Fetch schema and other data only after tenant is configured
  useEffect(() => {
    const fetchSchema = async () => {
      // Wait for tenant configuration to complete
      if (!tenantConfigured) {
        return;
      }
      try {
        setLoading(true);
        const tenantCode = localStorage.getItem('tenantCode') || '';

        const rolesResponse = await fetchRoleData();
        const rolesData = rolesResponse?.result ?? [];
        setRolesList(rolesData);

        // External flows provide their own form subtype. Keep the existing
        // registration form as the fallback for a normal account visit.
        const flow = localStorage.getItem('flow');
        const response = flow
          ? await schemaRead(FORM_CONFIG.FLOW_TYPE, flow)
          : await schemaRead();
        const fields = response?.result?.data?.fields?.result ?? [];
        const meta = response?.result?.data?.fields?.meta ?? {};
        if (fields.length === 0) {
          throw new Error('No form fields received from API');
        }
        setFormReadFields(fields);

        let subrolesData = [];
        const selectedRoleObj = rolesData.find((role: any) => role.externalId);
        if (selectedRoleObj) {
          const subrolesResponse = await getSubroles(selectedRoleObj._id);
          subrolesData = subrolesResponse.result ?? [];
        }

        const { schema, uiSchema, fieldNameToFieldIdMapping } =
          generateRJSFSchema(
            fields,
            selectedRoleObj,
            rolesData,
            subrolesData,
            i18n.language
          );
        if (subrolesData?.length === 0) {
          delete schema.properties?.['Sub-Role'];
          delete uiSchema?.['Sub-Role'];
        }

        if (isUpdate) {
          delete schema.properties?.password;
          delete schema.properties?.confirm_password;
          delete schema.properties?.Confirm_password;
          if (schema.required) {
            schema.required = schema.required.filter(
              (f: string) =>
                f !== 'password' &&
                f !== 'confirm_password' &&
                f !== 'Confirm_password'
            );
          }
          if (uiSchema) {
            delete uiSchema.password;
            delete uiSchema.confirm_password;
            delete uiSchema.Confirm_password;
            if (uiSchema.Username) {
              uiSchema.Username['ui:readonly'] = true;
              uiSchema.Username['ui:disabled'] = true;
            }
            if (uiSchema.username) {
              uiSchema.username['ui:readonly'] = true;
              uiSchema.username['ui:disabled'] = true;
            }
          }
        }

        const registrationCodeConfig = meta.registration_code;

        setFormSchema({
          ...schema,
          meta: {
            ...schema.meta,
            registrationCodeConfig,
          },
        });
        setUiSchema(uiSchema);
        setFieldNameToFieldIdMapping(fieldNameToFieldIdMapping);
      } catch (error) {
        console.error('Error fetching schema:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
    setIsAuthenticated(!!localStorage.getItem('accToken'));
  }, [tenantConfigured, isUpdate, i18n.language]);

  // Third useEffect: If in update mode, load user profile to prefill the form
  useEffect(() => {
    if (!isUpdate || formReadFields.length === 0) return;
    const token = localStorage.getItem('accToken');
    if (!token) return;

    const loadProfile = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.userProfileRead, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-auth-token': token,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const profile = data?.result?.response || data?.result;
          if (profile) {
            const prefilled = formReadFields.reduce(
              (values: Record<string, any>, field: any) => {
                if (!field?.name) return values;

                const value = getProfileFieldValue(profile, field);
                if (value !== undefined && value !== null) {
                  values[field.name] = value;
                }
                return values;
              },
              {}
            );

            setPrefilledFormData(prefilled);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile for account update:', err);
      }
    };

    loadProfile();
  }, [isUpdate, formReadFields]);

  const handleSubmit = ({ formData }: any) => {
    setFormData(formData);
  };

  const handleBack = () => {
    window.history.back();
  };

  const theme = createTheme({
    components: {
      MuiInputBase: {
        styleOverrides: {
          input: {
            fontSize: '14px',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E2E8F0',
            },
            '&:hover fieldset': {
              borderColor: '#CBD5E1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#582E92',
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiFormControl: {
        styleOverrides: {
          root: {
            marginTop: '3px !important',
            marginBottom: '3px !important',
          },
          marginNormal: {
            marginTop: '3px !important',
            marginBottom: '3px !important',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
          },
          html: {
            margin: 0,
            padding: 0,
            boxSizing: 'border-box',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          bgcolor: '#FFFFFF',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column: Branding, Tagline, Hero Illustration (Desktop) */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            width: { md: '48%', lg: '46%' },
            flexDirection: 'column',
            p: { md: '44px 48px', lg: '56px 64px' },
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #F1F5F9',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
          }}
        >
          {/* Top Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/assets/images/SG_Logo.png"
              alt="Shikshagraha"
              sx={{
                height: { md: '46px', lg: '52px' },
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          {/* Illustration Container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              my: 'auto',
              width: '100%',
              minHeight: 0,
            }}
          >
            <Box
              component="img"
              src="/assets/images/mitra_profile_hero.jpg"
              alt="Mitra Illustration"
              sx={{
                maxWidth: '100%',
                maxHeight: '440px',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Box>

        {/* Right Column: Profile Form Container */}
        <Box
          sx={{
            flex: 1,
            bgcolor: '#FAFAFC',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            maxWidth: '100vw',
          }}
        >
          {/* Form Content Area */}
          <Box
            sx={{
              maxWidth: '560px',
              width: '100%',
              minWidth: 0,
              mx: 'auto',
              p: { xs: '20px 16px', sm: '36px', md: '48px 40px' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', md: 'center' },
              flex: 1,
            }}
          >
            {/* Account Header: Back Button + Title */}
            <Box
              sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  onClick={handleBack}
                  sx={{
                    p: 1,
                    color: '#582E92',
                    bgcolor: '#F3E8FF',
                    '&:hover': { bgcolor: '#E9D5FF' },
                    borderRadius: '10px',
                  }}
                  aria-label={translatePipe('back', i18n.language, 'Back')}
                >
                  <ArrowBackIcon sx={{ fontSize: '20px' }} />
                </IconButton>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '20px', md: '24px' },
                    color: '#0F172A',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {translatePipe('yourDetails', i18n.language)}
                </Typography>
              </Box>
            </Box>

            {loading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                }}
              >
                <CircularProgress sx={{ color: '#582E92' }} />
              </Box>
            )}

            {formSchema && (
              <Box
                sx={{
                  width: '100%',
                  minWidth: 0,
                  mx: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: { xs: 1, md: '0 0 auto' },
                  '& .MuiGrid-root.MuiGrid-item, & .MuiGrid-item': {
                    pt: '3px !important',
                    pb: '3px !important',
                  },
                  '& .MuiFormControl-root, & .MuiFormControl-marginNormal': {
                    mt: '3px !important',
                    mb: '3px !important',
                  },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    bgcolor: '#FFFFFF',
                    transition: 'all 0.2s ease',
                    '& fieldset': {
                      borderColor: '#E2E8F0',
                      borderWidth: '1px',
                    },
                    '&:hover fieldset': {
                      borderColor: '#CBD5E1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#582E92',
                      borderWidth: '1.5px',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: 600,
                    '&.Mui-focused': {
                      color: '#582E92',
                    },
                  },
                  '& .MuiSelect-select': {
                    borderRadius: '10px',
                  },
                  '& .rjsf, & form, & fieldset, & .MuiGrid-root': {
                    minWidth: 0,
                    maxWidth: '100%',
                  },
                }}
              >
                <DynamicForm
                  schema={formSchema}
                  uiSchema={uiSchema}
                  SubmitaFunction={handleSubmit}
                  hideSubmit={false}
                  onChange={({ formData }: { formData: any }) => {
                    setFormData(formData);
                  }}
                  fieldIdMapping={fieldNameToFieldIdMapping}
                  isUpdate={isUpdate}
                  prefilledFormData={prefilledFormData}
                  submitButtonText={translatePipe(
                    'saveAndContinue',
                    i18n.language,
                    'Save & Continue'
                  )}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
