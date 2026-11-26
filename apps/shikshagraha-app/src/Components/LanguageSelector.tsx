'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  SxProps,
  Theme,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_LABELS,
  DEFAULT_LANGUAGES,
  LanguageOption,
} from '../constants/languages';
import { SHARED_KEYS } from '../constants/sharedKeys';

export interface LanguageSelectorProps {
  /** If true, positions the selector fixed in the top-right corner of the page */
  floating?: boolean;
  /** Active language code override (e.g. 'en', 'hi') */
  currentLanguage?: string;
  /** Custom list of available languages. Defaults to DEFAULT_LANGUAGES */
  languages?: LanguageOption[];
  /** Callback fired when the user selects a new language */
  onChange?: (newLang: string) => void;
  /** Additional custom MUI styles for outer container */
  sx?: SxProps<Theme>;
}

export default function LanguageSelector({
  floating = false,
  currentLanguage,
  languages = DEFAULT_LANGUAGES,
  onChange,
  sx,
}: LanguageSelectorProps) {
  const { i18n } = useTranslation();

  const getInitialLanguage = (): string => {
    if (currentLanguage) return currentLanguage.toLowerCase();
    if (i18n?.language) return i18n.language.toLowerCase();
    if (typeof window !== 'undefined') {
      const stored =
        localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY) ||
        localStorage.getItem(SHARED_KEYS.PREFERRED_LANGUAGE) ||
        'en';
      return stored.toLowerCase();
    }
    return 'en';
  };

  const [selectedLang, setSelectedLang] = useState<string>(getInitialLanguage);

  // Dynamic branding theming primary color
  const [primaryColor, setPrimaryColor] = useState('#572E91');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = localStorage.getItem('primaryColor');
      if (p) setPrimaryColor(p);
    }
  }, []);

  // Sync state if currentLanguage or i18n.language changes externally
  useEffect(() => {
    if (currentLanguage) {
      setSelectedLang(currentLanguage.toLowerCase());
    } else if (i18n?.language) {
      setSelectedLang(i18n.language.toLowerCase());
    }
  }, [currentLanguage, i18n?.language]);

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    // Persist both legacy and current keys because redirecting applications
    // may use either key before returning to this app.
    const newLang = event.target.value.toLowerCase();
    setSelectedLang(newLang);

    if (typeof window !== 'undefined') {
      localStorage.setItem(SHARED_KEYS.PREFERRED_LANGUAGE_LEGACY, newLang);
      localStorage.setItem(SHARED_KEYS.PREFERRED_LANGUAGE, newLang);
    }

    if (i18n && typeof i18n.changeLanguage === 'function') {
      i18n.changeLanguage(newLang);
    }

    if (onChange) {
      onChange(newLang);
    }
  };

  const activeOptions = useMemo(() => {
    if (languages && languages.length > 0) {
      return languages;
    }
    return DEFAULT_LANGUAGES;
  }, [languages]);

  const selectElement = (
    <FormControl size="small" sx={{ overflow: 'visible' }}>
      <Select
        value={selectedLang}
        onChange={handleLanguageChange}
        IconComponent={KeyboardArrowDownIcon}
        aria-label="Select Language"
        renderValue={(val) => {
          const current = activeOptions.find(
            (o) => o.code.toLowerCase() === val.toLowerCase()
          );
          const label =
            current?.label || LANGUAGE_LABELS[val] || val.toUpperCase();
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.85,
                fontWeight: 600,
                fontSize: '13.5px',
                color: '#1f2937',
              }}
            >
              <TranslateIcon sx={{ fontSize: '17px', color: primaryColor }} />
              <span>{label}</span>
            </Box>
          );
        }}
        MenuProps={{
          disableScrollLock: true,
          autoFocus: false,
          anchorOrigin: {
            vertical: 'bottom',
            horizontal: 'right',
          },
          transformOrigin: {
            vertical: 'top',
            horizontal: 'right',
          },
          PaperProps: {
            elevation: 4,
            sx: {
              borderRadius: '14px',
              mt: 0.75,
              minWidth: '150px',
              maxHeight: 280,
              overflowY: 'auto',
              overflowX: 'hidden',
              boxShadow:
                '0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 10px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb',
              p: 0.5,
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#cbd5e1',
                borderRadius: '4px',
              },
            },
          },
        }}
        sx={{
          borderRadius: '24px',
          height: '38px',
          minWidth: '128px',
          bgcolor: '#ffffff',
          boxShadow: floating ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
          transition: 'all 0.2s ease-in-out',
          '& .MuiSelect-select': {
            py: '6px',
            pr: '32px !important',
            pl: '12px',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
            transition: 'border-color 0.2s ease',
          },
          '&:hover': {
            boxShadow: floating
              ? '0 4px 12px rgba(0, 0, 0, 0.12)'
              : '0 2px 6px rgba(0, 0, 0, 0.05)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#cbd5e1',
            },
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 2px ${primaryColor}25`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryColor,
              borderWidth: '1.5px',
            },
          },
          '& .MuiSvgIcon-root': {
            color: '#64748b',
            fontSize: '19px',
            right: '8px',
            transition: 'transform 0.2s ease',
          },
          '&.Mui-expanded .MuiSvgIcon-root': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {activeOptions.map((lang) => {
          const isSelected = selectedLang === lang.code.toLowerCase();
          return (
            <MenuItem
              key={lang.code}
              value={lang.code}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13.5px',
                fontWeight: isSelected ? 600 : 500,
                py: 1,
                px: 1.5,
                borderRadius: '8px',
                mx: 0.25,
                my: 0.25,
                transition: 'all 0.15s ease',
                '&.Mui-selected': {
                  bgcolor: `${primaryColor}12`,
                  color: primaryColor,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: `${primaryColor}1f`,
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <span>
                {lang.label ||
                  LANGUAGE_LABELS[lang.code] ||
                  lang.code.toUpperCase()}
              </span>
              {isSelected && (
                <CheckIcon
                  sx={{ fontSize: '16px', color: primaryColor, ml: 1.5 }}
                />
              )}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );

  if (floating) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 28 },
          zIndex: 1300,
          overflow: 'visible',
          ...sx,
        }}
      >
        {selectElement}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'visible',
        flexShrink: 0,
        ...sx,
      }}
    >
      {selectElement}
    </Box>
  );
}
