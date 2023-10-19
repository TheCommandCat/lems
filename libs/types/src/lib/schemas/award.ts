import { ObjectId } from 'mongodb';
import { AwardNames } from '../constants';
import { Team } from './team';

export interface Award {
  eventId: ObjectId;
  name: AwardNames;
  index: number;
  place: number;
  winner?: Team | string;
}
