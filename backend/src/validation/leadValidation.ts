import Joi from 'joi';

export const createLeadSchema = Joi.object({
  title: Joi.string().min(1).max(255).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must not exceed 255 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Description must not exceed 1000 characters'
  }),
  status: Joi.string().valid('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'new', 'contacted', 'qualified', 'closed').optional().custom((value: string) => {
    if (value) {
      return value.toUpperCase();
    }
    return value;
  }).messages({
    'any.only': 'Status must be one of: NEW, CONTACTED, QUALIFIED, CLOSED'
  }),
  source: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Source must not exceed 100 characters'
  }),
  ownerId: Joi.string().optional().messages({
    'string.base': 'Owner ID must be a string'
  }),
  metadata: Joi.object().optional().messages({
    'object.base': 'Metadata must be a valid object'
  })
});

export const updateLeadSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title must not exceed 255 characters'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Description must not exceed 1000 characters'
  }),
  status: Joi.string().valid('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'new', 'contacted', 'qualified', 'closed').optional().custom((value: string) => {
    if (value) {
      return value.toUpperCase();
    }
    return value;
  }).messages({
    'any.only': 'Status must be one of: NEW, CONTACTED, QUALIFIED, CLOSED'
  }),
  source: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Source must not exceed 100 characters'
  }),
  ownerId: Joi.string().optional().allow(null).messages({
    'string.base': 'Owner ID must be a string'
  }),
  metadata: Joi.object().optional().messages({
    'object.base': 'Metadata must be a valid object'
  })
});

export const assignLeadSchema = Joi.object({
  ownerId: Joi.string().uuid().required().messages({
    'string.guid': 'Owner ID must be a valid UUID',
    'any.required': 'Owner ID is required'
  })
});

export const getLeadsQuerySchema = Joi.object({
  owner: Joi.string().uuid().optional().messages({
    'string.guid': 'Owner must be a valid UUID'
  }),
  status: Joi.string().valid('NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'new', 'contacted', 'qualified', 'closed').optional().custom((value: string) => {
    if (value) {
      return value.toUpperCase();
    }
    return value;
  }).messages({
    'any.only': 'Status must be one of: NEW, CONTACTED, QUALIFIED, CLOSED'
  }),
  groupBy: Joi.string().valid('status').optional().messages({
    'any.only': 'GroupBy must be one of: status'
  }),
  page: Joi.number().integer().min(1).optional().default(1).messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100'
  })
});

export const leadParamsSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Lead ID must be a valid UUID',
    'any.required': 'Lead ID is required'
  })
});
