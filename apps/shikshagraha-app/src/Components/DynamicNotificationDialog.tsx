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
import { Close } from '@mui/icons-material';

interface DynamicNotificationDialogProps {
  open: boolean;
  onClose: () => void;
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
  title,
  type,
  message,
  userName,
  buttonText,
  showCloseIcon = false,
}) => {
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
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', py: 1 }}>
        <DialogContentText>
          {type === 'success' ? (
            <>
              Welcome,
              <span style={{ fontWeight: 'bold' }}> {userName} </span> Your
              account has been successfully registered. Please use your username
              to login.
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
          onClick={onClose}
          variant="contained"
          sx={{
            bgcolor: '#582E92',
            color: '#FFFFFF',
            borderRadius: '30px',
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: '14px',
            px: 4,
            py: 1,
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
