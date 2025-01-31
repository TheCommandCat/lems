import { GetServerSideProps, GetServerSidePropsContext, NextPage } from 'next';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Typography,
  TableBody,
  Paper,
  Container,
  Box,
  Stack,
  useMediaQuery
} from '@mui/material';
import { PortalEvent, PortalFieldSchedule } from '@lems/types';
import { fetchEvent } from '../../../../lib/api';
import { useRealtimeData } from '../../../../hooks/use-realtime-data';
import LoadingAnimation from '../../../../components/loading-animation';
import { localizedMatchStage } from '../../../../lib/localization';
import theme from '../../../../lib/theme';
import StyledEventSubtitle from '../../../../components/events/styled-event-subtitle';
import { useEffect } from 'react';
import dayjs from 'dayjs';

interface Props {
  event: PortalEvent;
}

const Page: NextPage<Props> = ({ event }) => {
  const {
    data: schedule,
    isLoading,
    error
  } = useRealtimeData<PortalFieldSchedule>(`/events/${event.id}/schedule/field`);
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const scrollToCurrentRound = (roundIndex: number) => {
    const element = document.getElementById(`paper-${roundIndex}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
  };

  useEffect(() => {
    if (!schedule?.rounds) return;

    const CurrentRound = schedule.rounds.findLastIndex(round =>
      dayjs(
        `${dayjs().format('YYYY-MM-DD')} ${Object.keys(round.schedule.rows).slice(-1)[0]}`
      ).isBefore(dayjs())
    );

    scrollToCurrentRound(CurrentRound);
  }, [schedule]);

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Typography variant="h2">לוח זמנים - זירה</Typography>
      <StyledEventSubtitle event={event} />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          mb: 2
        }}
      >
        {(isLoading || error) && <LoadingAnimation />}
        {!isLoading && !error && (
          <Stack spacing={2} mt={2}>
            {schedule.rounds.map((round, index) => (
              <Paper id={`paper-${index}`} key={index} sx={{ p: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          colSpan={round.schedule.columns.length + 2}
                          align={isDesktop ? 'center' : 'left'}
                        >
                          <Typography fontWeight={500}>
                            סבב {localizedMatchStage[round.stage]} #{round.number}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Typography fontWeight={500}>מקצה</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={500}>זמן התחלה</Typography>
                        </TableCell>
                        {round.schedule.columns.map(column => (
                          <TableCell key={column.id}>
                            <Typography fontWeight={500}>{column.name}</Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(round.schedule.rows).map(([time, teams]) => (
                        <TableRow
                          key={time}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell>{teams.number}</TableCell>
                          <TableCell>{time}</TableCell>
                          {round.schedule.columns.map(column => {
                            const team = teams.data.find(t => t?.column === column.id);
                            return (
                              <TableCell key={column.id}>{team ? `#${team.number}` : ''}</TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const eventId = ctx.params?.id as string;

  const { event } = await fetchEvent(eventId);
  return { props: { event } };
};

export default Page;
