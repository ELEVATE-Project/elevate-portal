/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
'use client';
import { Layout, DynamicCard } from '@shared-lib';
import { useRouter } from 'next/navigation';
import { readHomeListForm } from '../../services/LoginService';
import { useEffect, useState } from 'react';
import {
  CircularProgress,
  Box,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from '@mui/material';
import AppConst from '../../utils/AppConst/AppConst';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

export default function Home() {
  // Constants
  const basePath = AppConst?.BASEPATH;
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cardData, setCardData] = useState([]);

  // Effects
  useEffect(() => {
    initializeHomePage();
  }, [router]);

  const initializeHomePage = async () => {
    if (!isUserAuthenticated()) {
      handleUnauthenticatedUser();
      return;
    }

    try {
      setLoadingStates(true);
      await fetchAndSetHomeData();
    } catch (err) {
      handleHomePageError(err);
    } finally {
      handleLoadingCompletion();
    }
  };
  const isUserAuthenticated = () => {
    return !!localStorage.getItem('accToken');
  };

  const handleUnauthenticatedUser = () => {
    clearAllCookies();
    router.replace('/');
  };

  const setLoadingStates = (isLoading: boolean) => {
    setPageLoading(isLoading);
    setLoading(isLoading);
  };

  const fetchAndSetHomeData = async () => {
    const cachedHomeData = getCachedHomeData();
    if (cachedHomeData) {
      setCardData(cachedHomeData);
      console.log('Using cached home data from localStorage');
    } else {
      const homeData = await fetchHomeData();
      if (homeData) {
        setCardData(homeData);
        cacheHomeData(homeData);
      } else {
        throw new Error('Failed to load home data');
      }
    }
  };
  const getCachedHomeData = () => {
    try {
      const cachedData = localStorage.getItem('HomeData');
      if (!cachedData) {
        return null;
      }
      const parsedData = JSON.parse(cachedData);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error('Error reading cached home data:', error);
      return null;
    }
  };
  const handleHomePageError = (error: any) => {
    setError('Failed to initialize home page');
    console.error('Home page initialization error:', error);
  };

  const handleLoadingCompletion = () => {
    const hasCachedData = getCachedHomeData();
    const contentDelay = hasCachedData ? 100 : 500; // Faster if cached
    const pageDelay = hasCachedData ? 300 : 800; // Faster if cache

    setTimeout(() => setLoading(false), contentDelay);
    setTimeout(() => setPageLoading(false), pageDelay);
  };

  const fetchHomeData = async () => {
    try {
      validateOrganizationHeader();
      const token = getAuthToken();
      const data = await readHomeListForm(token);

      return data?.result || [];
    } catch (err) {
      console.error('Error fetching home data:', err);
      throw err;
    }
  };
  const validateOrganizationHeader = () => {
    const header = JSON.parse(localStorage.getItem('headers') || '{}');
    if (!header['org-id']) {
      throw new Error('Organization ID not found');
    }
  };

  const getAuthToken = () => {
    const token = localStorage.getItem('accToken');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return token;
  };

  const cacheHomeData = (homeData: any[]) => {
    if (homeData?.length > 0) {
      localStorage.setItem('HomeData', JSON.stringify(homeData));
      localStorage.setItem(
        'theme',
        JSON.stringify(homeData[1]?.meta?.theme || {})
      );
    }
  };

  const handleCardClick = (card: any) => {
    if (card.sameOrigin) {
      navigateToSameOrigin(card.url);
    } else {
      navigateToExternal(card.url, card.title);
    }
  };

  const navigateToSameOrigin = (url: string) => {
    router.push(url);
  };
  const navigateToExternal = (url: string, title?: string) => {
    if (title === 'MITRA') {
      navigateToMitra(url);
    } else {
      navigateToGenericExternal(url);
    }
  };

  const navigateToMitra = (url: string) => {
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const accessToken = localStorage.getItem('accToken');
    window.location.href = `${url}${accessToken}&rerouteUrl=${encodedUrl}`;
  };

  /**
   * Navigates to generic external URL
   */
  const navigateToGenericExternal = (url: string) => {
    const accessToken = localStorage.getItem('accToken');
    window.location.href = url + accessToken;
  };

  const handleAccountClick = () => {
    router.push('/profile');
  };

  const handleLogoutConfirm = () => {
    clearUserData();
    router.push('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const clearUserData = () => {
    localStorage.removeItem('accToken');
    localStorage.clear();
  };

  const clearAllCookies = () => {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  };

  const getUserFirstName = () => {
    return localStorage.getItem('firstname') || 'User';
  };

  const getEnabledCards = () => {
    return cardData.filter((card) => card.enabled === true);
  };

  const renderFullPageLoader = () => (
    <Layout
      showTopAppBar={{
        title: 'Home',
        showMenuIcon: true,
        showBackIcon: false,
      }}
      isFooter={true}
      showLogo={true}
      showBack={true}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          gap: 3,
        }}
      >
        <CircularProgress
          size={60}
          thickness={4}
          sx={{
            color: '#582E92',
            animationDuration: '0.8s',
          }}
        />
        <Typography
          variant="h6"
          color="#582E92"
          sx={{
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          Loading...
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Please wait while we prepare your dashboard
        </Typography>
      </Box>
    </Layout>
  );

  /**
   * Renders the content loading spinner
   */
  const renderContentLoader = () => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
      }}
    >
      <CircularProgress size={40} sx={{ color: '#582E92' }} />
    </Box>
  );

  /**
   * Renders the welcome section
   */
  const renderWelcomeSection = () => (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography
        variant="h5"
        color="#582E92"
        fontWeight="bold"
        fontSize={{ xs: '22px', sm: '24px', md: '26px' }}
      >
        Welcome, {getUserFirstName()}
      </Typography>
    </Box>
  );

  /**
   * Renders individual card component
   */
  const renderCard = (card: any, index: number) => (
    <DynamicCard
      key={index}
      title={card.meta.title}
      icon={card.meta.icon}
      sx={{
        borderRadius: 2,
        boxShadow: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 6,
        },
        maxWidth: { xs: 280, sm: 350 },
      }}
      onClick={() => handleCardClick(card.meta)}
    />
  );

  /**
   * Renders the cards grid
   */
  const renderCardsGrid = () => {
    const enabledCards = getEnabledCards();

    if (enabledCards.length === 0) {
      return (
        <Typography textAlign="center" color="text.secondary">
          No enabled cards available
        </Typography>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 3,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {enabledCards.map((card, index) => renderCard(card, index))}
      </Box>
    );
  };

  /**
   * Renders the main content
   */
  const renderMainContent = () => (
    <>
      {renderWelcomeSection()}
      {renderCardsGrid()}
    </>
  );

  /**
   * Renders the profile icon
   */
  const renderProfileIcon = () => (
    <Box
      sx={{
        position: 'fixed',
        top: 10,
        right: 20,
        zIndex: 2000,
        backgroundColor: 'transparent',
        borderRadius: '50%',
      }}
    >
      <AccountCircleIcon
        sx={{ fontSize: 36, color: '#582E92', cursor: 'pointer' }}
        onClick={handleAccountClick}
      />
    </Box>
  );

  /**
   * Renders logout confirmation dialog
   */
  const renderLogoutDialog = () => (
    <Dialog open={showLogoutModal} onClose={handleLogoutCancel}>
      <DialogTitle>Confirm Logout</DialogTitle>
      <DialogContent>
        <DialogContentText>Are you sure you want to log out?</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleLogoutCancel} color="primary">
          No
        </Button>
        <Button onClick={handleLogoutConfirm} color="secondary">
          Yes, Logout
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ==================== MAIN RENDER ====================

  if (pageLoading) {
    return renderFullPageLoader();
  }

  return (
    <>
      <Layout
        showTopAppBar={{
          title: 'Home',
          showMenuIcon: true,
          showBackIcon: false,
        }}
        isFooter={true}
        showLogo={true}
        showBack={true}
      >
        {renderProfileIcon()}
        <Box
          sx={{
            minHeight: '100vh',
            marginTop: { xs: '30px', sm: '90px' },
            marginBottom: { xs: '60px', sm: '90px' },
            paddingX: { xs: 2, sm: 3 },
          }}
        >
          {loading ? renderContentLoader() : renderMainContent()}
        </Box>
      </Layout>
      {renderLogoutDialog()}
    </>
  );
}
