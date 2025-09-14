import { Router } from 'express';
import { ActivityController } from '../controllers/activityController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createActivitySchema,
  activityParamsSchema,
  updateActivitySchema,
  leadIdParamsSchema
} from '../validation/activityValidation';

const router = Router();

// Activity routes
router.get(
  '/',
  authMiddleware,
  ActivityController.getAllActivities
);

router.get(
  '/lead/:leadId',
  authMiddleware,
  validate(leadIdParamsSchema, 'params'),
  ActivityController.getLeadActivities
);

router.get(
  '/:id',
  authMiddleware,
  validate(activityParamsSchema, 'params'),
  ActivityController.getActivityById
);

router.post(
  '/',
  authMiddleware,
  validate(createActivitySchema, 'body'),
  ActivityController.createActivity
);

router.put(
  '/:id',
  authMiddleware,
  validate(activityParamsSchema, 'params'),
  validate(updateActivitySchema, 'body'),
  ActivityController.updateActivity
);

router.delete(
  '/:id',
  authMiddleware,
  validate(activityParamsSchema, 'params'),
  ActivityController.deleteActivity
);

export default router;
