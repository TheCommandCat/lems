import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { DivisionState, RoleTypes } from '@lems/types';
import * as db from '@lems/database';
import asyncHandler from 'express-async-handler';
import divisionValidator from '../../../middlewares/division-validator';
import sessionsRouter from './sessions';
import matchesRouter from './matches';
import roomsRouter from './rooms';
import awardsRouter from './awards';
import usersRouter from './users';
import teamsRouter from './teams';
import rubricsRouter from './rubrics';
import tablesRouter from './tables';
import scoresheetRouter from './scoresheets';
import ticketsRouter from './tickets';
import cvFormsRouter from './cv-forms';
import exportRouter from './export';
import insightsRouter from './insights';
import deliberationsRouter from './deliberations';
import roleValidator from '../../../middlewares/role-validator';

const router = express.Router({ mergeParams: true });

router.use('/:divisionId', divisionValidator);

router.get(
  '/:divisionId',
  asyncHandler(async (req: Request, res: Response) => {
    let division;
    if (req.query.withEvent) {
      division = await db.getDivisionWithEvent({ _id: new ObjectId(req.params.divisionId) });
    } else {
      division = await db.getDivision({ _id: new ObjectId(req.params.divisionId) });
    }

    if (!req.query.withSchedule) delete division.schedule;
    res.json(division);
  })
);

router.get('/:divisionId/state', (req: Request, res: Response) => {
  db.getDivisionState({ divisionId: new ObjectId(req.params.divisionId) }).then(divisionState =>
    res.json(divisionState)
  );
});

router.put('/:divisionId/state', (req: Request, res: Response) => {
  const body: Partial<DivisionState> = { ...req.body };
  if (!body) return res.status(400).json({ ok: false });

  console.log(`⏬ Updating Division state for division ${req.params.divisionId}`);
  db.updateDivisionState({ divisionId: new ObjectId(req.params.divisionId) }, body).then(task => {
    if (task.acknowledged) {
      console.log('✅ Division state updated!');
      return res.json({ ok: true, id: task.upsertedId });
    } else {
      console.log('❌ Could not update Division state');
      return res.status(500).json({ ok: false });
    }
  });
});

router.use('/:eventId/awards', roleValidator('judge-advisor'), awardsRouter);

router.use('/:eventId/rooms', roomsRouter);

router.use('/:eventId/tables', tablesRouter);

router.use('/:eventId/users', roleValidator([]), usersRouter);

router.use('/:eventId/sessions', roleValidator([...RoleTypes]), sessionsRouter);

router.use('/:eventId/matches', matchesRouter);

router.use('/:eventId/teams', teamsRouter);

router.use('/:eventId/rubrics', roleValidator(['judge-advisor', 'lead-judge']), rubricsRouter);

router.use(
  '/:eventId/scoresheets',
  roleValidator(['audience-display', 'head-referee', 'reports', 'judge']),
  scoresheetRouter
);

router.use('/:eventId/tickets', roleValidator(['pit-admin', 'tournament-manager']), ticketsRouter);

router.use(
  '/:eventId/cv-forms',
  roleValidator(['judge-advisor', 'tournament-manager']),
  cvFormsRouter
);

router.use('/:eventId/export', roleValidator('judge-advisor'), exportRouter);

router.use(
  '/:eventId/insights',
  roleValidator(['head-referee', 'judge-advisor', 'lead-judge', 'tournament-manager']),
  insightsRouter
);

router.use(
  '/:divisionId/deliberations',
  roleValidator(['lead-judge', 'judge-advisor', 'tournament-manager']),
  deliberationsRouter
);

export default router;
