import Joi from 'joi';

export const createActivitySchema = Joi.object({
  leadId: Joi.string().uuid().required().messages({
    'string.guid': 'Lead ID must be a valid UUID',
    'any.required': 'Lead ID is required'
  }),
  type: Joi.string().valid('note', 'call', 'email', 'meeting', 'task').required().messages({
    'any.only': 'Type must be one of: note, call, email, meeting, task',
    'any.required': 'Type is required'
  }),
  title: Joi.string().max(200).optional().allow('').messages({
    'string.max': 'Title must not exceed 200 characters'
  }),
  body: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Body must not exceed 2000 characters'
  })
});

export const updateActivitySchema = Joi.object({
  type: Joi.string().valid('note', 'call', 'email', 'meeting', 'task').optional().messages({
    'any.only': 'Type must be one of: note, call, email, meeting, task'
  }),
  title: Joi.string().max(200).optional().allow('').messages({
    'string.max': 'Title must not exceed 200 characters'
  }),
  body: Joi.string().max(2000).optional().allow('').messages({
    'string.max': 'Body must not exceed 2000 characters'
  })
});

export const activityParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID must be a valid UUID',
    'any.required': 'ID is required'
  })
});

export const leadIdParamsSchema = Joi.object({
  leadId: Joi.string().uuid().required().messages({
    'string.guid': 'Lead ID must be a valid UUID',
    'any.required': 'Lead ID is required'
  })
});
