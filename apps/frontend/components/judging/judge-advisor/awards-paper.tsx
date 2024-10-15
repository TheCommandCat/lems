import React from 'react';
import { ObjectId, WithId } from 'mongodb';
import { enqueueSnackbar } from 'notistack';
import { Socket } from 'socket.io-client';
import { Paper, Box, Avatar, Typography, Stack } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import {
  Division,
  JudgingDeliberation,
  Award,
  Team,
  WSClientEmittedEvents,
  WSServerEmittedEvents,
  AwardNames,
  PersonalAwardTypes
} from '@lems/types';
import DisqualificationButton from '../../deliberations/disqualification-button';
import AwardWinnerSelector from './award-winner-selector';

interface AwardsPaperProps {
  division: WithId<Division>;
  teams: Array<WithId<Team>>;
  deliberations: Array<WithId<JudgingDeliberation>>;
  awards: Array<WithId<Award>>;
  socket: Socket<WSServerEmittedEvents, WSClientEmittedEvents>;
}

const AwardsPaper: React.FC<AwardsPaperProps> = ({
  division,
  teams,
  deliberations,
  awards,
  socket
}) => {
  const disqualifyTeam = (team: WithId<Team>) => {
    socket.emit('disqualifyTeam', division._id.toString(), team._id.toString(), response => {
      if (!response.ok) {
        enqueueSnackbar('לא הצלחנו לפסול את הקבוצה.', { variant: 'error' });
      }
    });
  };

  return (
    <Paper sx={{ borderRadius: 3, mb: 4, boxShadow: 2, p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          pb: 3
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#fbdcfc',
            color: '#e22deb',
            width: '2rem',
            height: '2rem',
            mr: 1
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: '1rem' }} />
        </Avatar>
        <Typography variant="h2" fontSize="1.25rem">
          פרסים
        </Typography>
      </Box>
      <Stack spacing={2}>
        <DisqualificationButton
          teams={teams.filter(
            t => !deliberations.find(d => d.isFinalDeliberation)?.disqualifications.includes(t._id)
          )}
          disqualifyTeam={disqualifyTeam}
          sx={{ width: 200 }}
        />
        {awards
          .filter(award => PersonalAwardTypes.includes(award.name as any)) // Have to cast to any since AwardNames is more general than PersonalAwardTypes
          .map(award => (
            <AwardWinnerSelector key={award._id.toString()} award={award} socket={socket} />
          ))}
      </Stack>
    </Paper>
  );
};

export default AwardsPaper;
