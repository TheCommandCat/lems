import random
from typing import Callable

from events.event import team_minimum_delta
from events.judging_session import JudgingSession
from events.ranking_match import Match
from events.practice_match import PracticeMatch
from models.team_activity import TeamActivity, ActivityType
from models.team import Team


def get_session_preference_function(session: TeamActivity):
    type_to_function = {
        ActivityType.JUDGING_SESSION: JudgingSession.calculate_preference,
        ActivityType.RANKING_MATCH: Match.calculate_preference,
        ActivityType.PRACTICE_MATCH: PracticeMatch.calculate_preference,
    }

    return type_to_function[session.activity_type]


def get_best_team_match(
    session: TeamActivity, teams: list[Team], preference_function: Callable
) -> Team:
    random.shuffle(teams)
    best_team = teams[0]
    best_score = preference_function(session, best_team)

    for team in teams:
        current_score = preference_function(session, team)
        if current_score > best_score:
            best_score = current_score
            best_team = team

    return best_team


def check_team_preference(team: Team, session: TeamActivity) -> TeamActivity | None:
    current_event_session_index = session.event_index
    team_current_event_session = None

    for team_session in team.team_events:
        if team_session.event_index == current_event_session_index:
            team_current_event_session = team_session

    # The team doesn't have a match of this type yet
    if team_current_event_session is None:
        team.team_events.append(session)
        session.team_number = team.team_number
        return

    current_sessions = team.team_events
    current_score = team_minimum_delta(current_sessions)

    modified_sessions = team.team_events.copy()
    modified_sessions.remove(team_current_event_session)
    modified_sessions.append(session)
    modified_score = team_minimum_delta(modified_sessions)

    if modified_score > current_score:
        # The team prefers the new session
        if team.team_number is not None:
            team_current_event_session.rejected_team_numbers.append(team.team_number)
        team_current_event_session.team_number = 0
        team.team_events = modified_sessions
        session.team_number = team.team_number
        return team_current_event_session
    else:
        # The team prefers the old session
        session.rejected_team_numbers.append(team.team_number)
        return session


def gale_shapley(
    teams: list[Team], sessions: list[TeamActivity], number_of_events: int
) -> tuple[list[Team], list[TeamActivity]]:
    sessions_left = [session for session in sessions if session.team_number is None]
    teams_left = [team for team in teams if len(team.team_events) != number_of_events]

    while len(teams_left) > 0:
        random.shuffle(sessions_left)
        current_session = sessions_left.pop()
        session_preference_function = get_session_preference_function(current_session)
        current_team = get_best_team_match(
            current_session, teams, session_preference_function
        )
        session_left_alone = check_team_preference(current_team, current_session)
        if session_left_alone is not None:
            sessions_left.append(session_left_alone)
        teams_left = [
            team for team in teams if len(team.team_events) != number_of_events
        ]

    return teams, sessions
