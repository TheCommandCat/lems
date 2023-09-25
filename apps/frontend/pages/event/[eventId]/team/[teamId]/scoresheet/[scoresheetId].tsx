import { useEffect, useState } from 'react';
import { ObjectId } from 'mongodb';
import { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { WithId } from 'mongodb';
import { Button, Paper, Stack, Typography } from '@mui/material';
import { purple } from '@mui/material/colors';
import NextLink from 'next/link';
import { Event, RobotGameMatch, RobotGameTable, SafeUser, Scoresheet, Team } from '@lems/types';
import Layout from '../../../../../../components/layout';
import { RoleAuthorizer } from '../../../../../../components/role-authorizer';
import ConnectionIndicator from '../../../../../../components/connection-indicator';
import { apiFetch } from '../../../../../../lib/utils/fetch';
import { useWebsocket } from '../../../../../../hooks/use-websocket';
import { localizeTeam } from '../../../../../../localization/teams';
import { localizedMatchType } from '../../../../../../localization/field';
import ScoresheetForm from '../../../../../../components/field/scoresheet/scoresheet-form';

interface ScoresheetSelectorProps {
  event: WithId<Event>;
  team: WithId<Team>;
  matchScoresheet: WithId<Scoresheet>;
}

const ScoresheetSelector: React.FC<ScoresheetSelectorProps> = ({
  event,
  team,
  matchScoresheet
}) => {
  const [teamScoresheets, setTeamScoresheets] = useState<Array<WithId<Scoresheet>> | undefined>(
    undefined
  );

  useEffect(() => {
    apiFetch(`/api/events/${event._id}/teams/${team._id}/scoresheets`)
      .then(res => res.json())
      .then((data: Array<WithId<Scoresheet>>) =>
        setTeamScoresheets(
          data.sort((a, b) =>
            a.stage === b.stage ? a.round - b.round : a.stage === 'practice' ? -1 : 1
          )
        )
      );
  }, [event._id, team._id]);

  return (
    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
      {teamScoresheets &&
        teamScoresheets.map(scoresheet => {
          return (
            <NextLink
              key={scoresheet._id.toString()}
              href={`/event/${event._id}/team/${team._id}/scoresheet/${scoresheet._id}`}
              passHref
            >
              <Button
                variant="contained"
                color="inherit"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor:
                    matchScoresheet._id === scoresheet._id ? purple[700] : 'transparent',
                  color: matchScoresheet._id === scoresheet._id ? '#fff' : purple[700],
                  borderRadius: '2rem',
                  '&:hover': {
                    backgroundColor:
                      matchScoresheet._id == scoresheet._id ? purple[700] : purple[700] + '1f'
                  }
                }}
              >
                {localizedMatchType[scoresheet.stage]} #{scoresheet.round}
              </Button>
            </NextLink>
          );
        })}
    </Stack>
  );
};

interface Props {
  user: WithId<SafeUser>;
  event: WithId<Event>;
  table: WithId<RobotGameTable>;
  team: WithId<Team>;
  match: WithId<RobotGameMatch>;
}

const Page: NextPage<Props> = ({ user, event, table, team, match }) => {
  const router = useRouter();
  const [scoresheet, setScoresheet] = useState<WithId<Scoresheet> | undefined>(undefined);
  if (!team.registered) router.back();
  if (match.status !== 'completed') router.back();
  if (scoresheet?.status === 'waiting-for-head-ref' && user.role !== 'head-referee')
    router.push(`/event/${event._id}/${user.role}`);

  const updateScoresheet = () => {
    apiFetch(`/api/events/${user.event}/tables/${table._id}/matches/${match._id}/scoresheet`)
      .then(res => res?.json())
      .then(data => setScoresheet(data));
  };

  const { socket, connectionStatus } = useWebsocket(
    event._id.toString(),
    ['field'],
    updateScoresheet,
    [
      {
        name: 'scoresheetUpdated',
        handler: (teamId, scoresheetId) => {
          if (scoresheetId === router.query.scoresheetId) updateScoresheet();
        }
      }
    ]
  );

  return (
    <RoleAuthorizer
      user={user}
      allowedRoles={
        scoresheet?.status === 'waiting-for-head-ref'
          ? ['head-referee']
          : ['referee', 'head-referee']
      }
      onFail={() => router.back()}
    >
      {team && (
        <Layout
          maxWidth="md"
          title={`${localizedMatchType[match.type]} #${match.round} של קבוצה #${team.number}, ${
            team.name
          } | ${event.name}`}
          error={connectionStatus === 'disconnected'}
          action={<ConnectionIndicator status={connectionStatus} />}
          back={`/event/${event._id}/${user.role}`}
          backDisabled={connectionStatus !== 'connecting'}
        >
          <Paper sx={{ p: 3, mt: 4, mb: 2 }}>
            <Typography variant="h2" fontSize="1.25rem" fontWeight={500} align="center">
              {localizeTeam(team)} | שולחן {table.name}
            </Typography>
          </Paper>
          <RoleAuthorizer user={user} allowedRoles={['head-referee']}>
            <ScoresheetSelector
              event={event}
              team={team}
              matchScoresheet={scoresheet as WithId<Scoresheet>}
            />
          </RoleAuthorizer>
          {scoresheet && (
            <ScoresheetForm
              event={event}
              team={team}
              scoresheet={scoresheet}
              user={user}
              socket={socket}
            />
          )}
        </Layout>
      )}
    </RoleAuthorizer>
  );
};

export const getServerSideProps: GetServerSideProps = async ctx => {
  try {
    const user = await apiFetch(`/api/me`, undefined, ctx).then(res => res?.json());

    let tableId;
    if (user.roleAssociation && user.roleAssociation.type === 'table') {
      tableId = user.roleAssociation.value;
    } else {
      const matches = await apiFetch(`/api/events/${user.event}/matches`, undefined, ctx).then(
        res => res?.json()
      );
      tableId = matches.find(
        (match: RobotGameMatch) => match.team == new ObjectId(String(ctx.params?.teamId))
      ).table;
    }

    const eventPromise = apiFetch(`/api/events/${user.event}`, undefined, ctx).then(res =>
      res?.json()
    );

    const teamPromise = apiFetch(
      `/api/events/${user.event}/teams/${ctx.params?.teamId}`,
      undefined,
      ctx
    ).then(res => res?.json());

    const tablePromise = apiFetch(
      `/api/events/${user.event}/tables/${tableId}`,
      undefined,
      ctx
    ).then(res => res?.json());

    const [table, team, event] = await Promise.all([tablePromise, teamPromise, eventPromise]);

    const match = await apiFetch(
      `/api/events/${user.event}/tables/${tableId}/matches`,
      undefined,
      ctx
    )
      .then(res => res?.json())
      .then(matches => matches.find((m: RobotGameMatch) => m.team == team._id));

    return { props: { user, event, table, team, match } };
  } catch (err) {
    return { redirect: { destination: '/login', permanent: false } };
  }
};

export default Page;