import { Router } from 'express';
import { LeadController } from '../controllers/leadController';
import { ActivityController } from '../controllers/activityController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  getLeadsQuerySchema,
  leadParamsSchema
} from '../validation/leadValidation';
import {
  createActivitySchema,
  activityParamsSchema
} from '../validation/activityValidation';

const router = Router();

// Lead routes
router.get(
  '/stats',
  authMiddleware,
  LeadController.getStats
);

router.get(
  '/',
  authMiddleware,
  validate(getLeadsQuerySchema, 'query'),
  LeadController.getLeads
);

router.get(
  '/:id',
  authMiddleware,
  validate(leadParamsSchema, 'params'),
  LeadController.getLeadById
);

router.post(
  '/',
  authMiddleware,
  validate(createLeadSchema, 'body'),
  LeadController.createLead
);

router.put(
  '/:id',
  authMiddleware,
  validate(leadParamsSchema, 'params'),
  validate(updateLeadSchema, 'body'),
  LeadController.updateLead
);

router.delete(
  '/:id',
  authMiddleware,
  validate(leadParamsSchema, 'params'),
  LeadController.deleteLead
);

router.post(
  '/:id/assign',
  authMiddleware,
  validate(leadParamsSchema, 'params'),
  validate(assignLeadSchema, 'body'),
  LeadController.assignLead
);

// Activity routes for leads
router.get(
  '/:id/activities',
  validate(activityParamsSchema, 'params'),
  ActivityController.getLeadActivities
);

router.post(
  '/:id/activities',
  authMiddleware,
  validate(activityParamsSchema, 'params'),
  validate(createActivitySchema, 'body'),
  ActivityController.createActivity
);

export default router;
