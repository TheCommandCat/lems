import { Filter, ObjectId, WithId } from 'mongodb';
import { RobotGameMatch } from '@lems/types';
import db from '../database';

export const getMatch = (filter: Filter<RobotGameMatch>) => {
  return db.collection<RobotGameMatch>('matches').findOne(filter);
};

export const getEventMatches = (eventId: ObjectId) => {
  return db
    .collection('matches')
    .aggregate<WithId<RobotGameMatch>>([
      {
        $match: { event: eventId }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team'
        }
      }
    ])
    .toArray();
};

export const getTableMatches = (tableId: ObjectId) => {
  return db.collection<RobotGameMatch>('matches').find({ table: tableId }).toArray();
};

export const addMatch = (match: RobotGameMatch) => {
  return db
    .collection<RobotGameMatch>('matches')
    .insertOne(match)
    .then(response => response);
};

export const addMatches = (matches: RobotGameMatch[]) => {
  return db
    .collection<RobotGameMatch>('matches')
    .insertMany(matches)
    .then(response => response);
};

export const updateMatch = (filter: Filter<RobotGameMatch>, newMatch: Partial<RobotGameMatch>) => {
  return db
    .collection<RobotGameMatch>('matches')
    .updateOne(filter, { $set: newMatch }, { upsert: true });
};

export const deleteMatch = (filter: Filter<RobotGameMatch>) => {
  return db
    .collection<RobotGameMatch>('matches')
    .deleteOne(filter)
    .then(response => response);
};

export const deleteTableMatches = (tableId: ObjectId) => {
  return db
    .collection<RobotGameMatch>('matches')
    .deleteMany({ table: tableId })
    .then(response => response);
};
