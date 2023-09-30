import { useState } from 'react';
import { WithId } from 'mongodb';
import { useRouter } from 'next/router';
import {
  Alert,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Event } from '@lems/types';
import { apiFetch } from '../../lib/utils/fetch';

interface Props {
  event: WithId<Event>;
}

const DeleteEventData: React.FC<Props> = ({ event }) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);

  const handleConfirm = () => {
    apiFetch(`/api/admin/events/${event._id}/data`, {
      method: 'DELETE'
    }).then(() => {
      setOpen(false);
      router.reload();
    });
  };

  return (
    <>
      <Stack direction="row" justifyContent="center" spacing={2} mb={4}>
        <Alert
          severity="error"
          sx={{
            fontWeight: 500,
            maxWidth: '20rem',
            mx: 'auto',
            border: '1px solid #ff2f00'
          }}
        >
          יש כבר נותנים לאירוע
        </Alert>
        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteForeverIcon />}
          sx={{ borderRadius: '1rem' }}
          onClick={() => setOpen(true)}
        >
          מחיקת נתוני האירוע
        </Button>
      </Stack>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="delete-data-title"
        aria-describedby="delete-data-description"
      >
        <DialogTitle id="delete-data-title">מחיקת נתוני האירוע</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-data-description">
            {`אתם עומדים למחוק את כל נתוני האירוע, כולל תוצאות ופרסים מיום התחרות.
            פעולה זו אינה ניתנת לשחזור במקרה של טעות. אנא אשרו שברצונכם למחוק
            את כל המידע הקיים מאירוע "${event.name}".`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleConfirm} autoFocus>
            אישור
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteEventData;
