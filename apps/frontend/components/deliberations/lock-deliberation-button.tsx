import { WithId } from 'mongodb';
import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { JudgingDeliberation } from '@lems/types';

interface LockDeliberationButtonProps {
  deliberation: WithId<JudgingDeliberation>;
  deliberationName: string;
  lockDeliberation: (deliberation: WithId<JudgingDeliberation>) => void;
}

const LockDeliberationButton: React.FC<LockDeliberationButtonProps> = ({
  deliberation,
  deliberationName,
  lockDeliberation
}) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Box display="flex" alignItems="center">
      <Button
        startIcon={<LockOutlinedIcon />}
        variant="contained"
        onClick={() => setOpen(true)}
        disabled={deliberation.status !== 'in-progress'}
        fullWidth
      >
        נעילת הדיון
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="lock-deliberation-title"
        aria-describedby="lock-deliberation-description"
      >
        <DialogTitle id="deliberation-title">נעילת דיון {deliberationName}</DialogTitle>
        <DialogContent>
          <DialogContentText id="deliberation-description">
            פעולה זו לא תאפשר לאף אחד לערוך את הדיון יותר. האם אתם בטוחים שברצונכם לנעול את הדיון?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>ביטול</Button>
          <Button
            onClick={() => {
              lockDeliberation(deliberation);
              setOpen(false);
            }}
            autoFocus
          >
            אישור
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LockDeliberationButton;
