import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Close, GppMaybe, CheckCircle } from '@mui/icons-material';

interface DynamicNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
  title: string;
  type: 'success' | 'userExists' | 'error' | '';
  message?: string;
  userName?: string;
  buttonText: string;
  showCloseIcon?: boolean;
}

const DynamicNotificationDialog: React.FC<DynamicNotificationDialogProps> = ({
  open,
  onClose,
  onAction,
  title,
  type,
  message,
  userName,
  buttonText,
  showCloseIcon = false,
}) => {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          borderRadius: 3,
          boxShadow: 24,
          p: 2,
          position: 'relative',
        },
      }}
    >
      {showCloseIcon && (
        <Box position="absolute" top={8} right={8}>
          <IconButton onClick={onClose} size="small" aria-label="Close">
            <Close fontSize="small" sx={{ color: 'text.secondary' }} />
          </IconButton>
        </Box>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4, pb: 1 }}>
        {type === 'userExists' && (
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#F3E5F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GppMaybe sx={{ fontSize: 45, color: '#582E92' }} />
          </Box>
        )}
        {type === 'success' && (
          <CheckCircle sx={{ fontSize: 75, color: '#4CAF50' }} />
        )}
      </Box>
      <DialogTitle sx={{ textAlign: 'center', pt: 1, pb: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 1 }}>
        <DialogContentText>
          {type === 'success' ? (
            <>
              Welcome,
              <span style={{ fontWeight: 'bold' }}> {userName || 'User'} </span>{' '}
              Your account has been successfully registered.
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pt: 2, pb: 3 }}>
        <Button
          onClick={handleAction}
          variant="contained"
          fullWidth
          sx={{
            bgcolor: '#582E92',
            color: '#FFFFFF',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            py: 1.5,
            mx: 2,
            '&:hover': {
              bgcolor: '#4a267a',
            },
          }}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DynamicNotificationDialog;
