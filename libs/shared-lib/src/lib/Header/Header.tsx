"use client";
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface HeaderProps {
  showLogo?: boolean;
  showBack?: boolean;
  handleBack?: () => void;
  logoText?: string;
  title?: string;
  titleFontSize?: string | number;
  titleFontWeight?: string | number;
  languageSelector?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  showLogo = false,
  showBack = false,
  handleBack,
  logoText = 'Logo',
  title = 'Title',
  titleFontSize = '22px',
  titleFontWeight = 500,
  languageSelector,
  rightAction,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        gap: '6px',
        overflow: 'visible',
      }}
    >
      {showBack && (
        <IconButton onClick={handleBack} aria-label="Go Back">
          <ArrowBackIcon />
        </IconButton>
      )}
      {showLogo && (
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {logoText}
        </Typography>
      )}
      {title && (
        <Typography
          variant="h6"
          sx={{
            fontSize: titleFontSize,
            fontWeight: titleFontWeight,
            marginLeft: showBack ? '8px' : 0,
            flexGrow: 1,
          }}
        >
          {title}
        </Typography>
      )}
      {(languageSelector || rightAction) && (
        <Box
          sx={{
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            overflow: 'visible',
            flexShrink: 0,
          }}
        >
          {languageSelector}
          {rightAction}
        </Box>
      )}
    </Box>
  );
};
