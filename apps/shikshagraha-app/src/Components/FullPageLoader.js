import { CircularProgress, Box, Typography } from '@mui/material';
import AppConst from '../utils/AppConst/AppConst';
import { Layout } from '@shared-lib';
/**
 * Full page loader component
 */
export const FullPageLoader = () => (
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
        color: AppConst.UI.COLORS.PRIMARY,
        animationDuration: '0.8s',
      }}
    />
    <Typography
      variant="h6"
      color={AppConst.UI.COLORS.PRIMARY}
      sx={{
        fontWeight: 'bold',
        textAlign: 'center',
      }}
    >
      Loading...
    </Typography>
    <Typography
      variant="body2"
      color={AppConst.UI.COLORS.TEXT_SECONDARY}
      sx={{ textAlign: 'center' }}
    >
      Please wait while we prepare your dashboard
    </Typography>
  </Box>
);

/**
 * Content loader component (for inline loading)
 */
export const ContentLoader = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
    }}
  >
    <CircularProgress size={40} sx={{ color: AppConst.UI.COLORS.PRIMARY }} />
  </Box>
);

/**
 * Full page loader with layout wrapper
 */
export const FullPageLoaderWithLayout = () => (
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
    <FullPageLoader />
  </Layout>
);
