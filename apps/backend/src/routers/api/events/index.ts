import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { Event } from '@lems/types';
import * as db from '@lems/database';
import eventValidator from '../../../middlewares/event-validator';
import sessionsRouter from './sessions';
import matchesRouter from './matches';
import roomsRouter from './rooms';
import usersRouter from './users';
import teamsRouter from './teams';
import rubricsRouter from './rubrics';
import tablesRouter from './tables';
import scoresheetRouter from './scoresheets';

const router = express.Router({ mergeParams: true });

router.post('/', (req: Request, res: Response) => {
  const body: Event = { ...req.body };
  body.startDate = new Date(body.startDate);
  body.endDate = new Date(body.endDate);

  if (body) {
    console.log('⏬ Creating Event...');
    db.addEvent(body).then(task => {
      if (task.acknowledged) {
        console.log('✅ Event created!');
        return res.json({ ok: true, id: task.insertedId });
      } else {
        console.log('❌ Could not create Event');
        return res.status(500).json({ ok: false });
      }
    });
  } else {
    return res.status(400).json({ ok: false });
  }
});

router.use('/:eventId', eventValidator);

router.get('/:eventId', (req: Request, res: Response) => {
  db.getEvent({ _id: new ObjectId(req.params.eventId) }).then(event => res.json(event));
});

router.put('/:eventId', (req: Request, res: Response) => {
  const body: Event = { ...req.body };
  body.startDate = new Date(body.startDate);
  body.endDate = new Date(body.endDate);

  if (body) {
    console.log(`⏬ Updating Event ${req.params.eventId}`);
    db.updateEvent({ _id: new ObjectId(req.params.eventId) }, body).then(task => {
      if (task.acknowledged) {
        console.log('✅ Event updated!');
        return res.json({ ok: true, id: task.upsertedId });
      } else {
        console.log('❌ Could not update Event');
        return res.status(500).json({ ok: false });
      }
    });
  } else {
    return res.status(400).json({ ok: false });
  }
});

router.get('/:eventId/state', (req: Request, res: Response) => {
  db.getEventState({ event: new ObjectId(req.params.eventId) }).then(eventState =>
    res.json(eventState)
  );
});

router.use('/:eventId/rooms', roomsRouter);

router.use('/:eventId/tables', tablesRouter);

router.use('/:eventId/users', usersRouter);

router.use('/:eventId/sessions', sessionsRouter);

router.use('/:eventId/matches', matchesRouter);

router.use('/:eventId/teams', teamsRouter);

router.use('/:eventId/rubrics', rubricsRouter);

router.use('/:eventId/scoresheets', scoresheetRouter);

export default router;
