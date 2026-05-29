import { body, validationResult } from 'express-validator';

export const validateChat = [
  body('message')
    .optional()
    .isString()
    .withMessage('Mensagem deve ser texto.')
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Mensagem muito longa. Maximo: 50000 caracteres.')
    .escape(),

  body('history')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Historico invalido. Maximo: 50 mensagens.'),

  body('history.*.role')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('Role invalido no historico.'),

  // ✅ CORRIGIDO: content pode ser string OU array (mensagens com imagem)
  // A filtragem para string é feita no chat.js antes de enviar para a IA
  body('history.*.content')
    .optional(),

  body('image')
    .optional()
    .isString()
    .withMessage('Imagem deve ser string base64.'),

  body('audio')
    .optional()
    .isString()
    .withMessage('Audio deve ser string base64.'),

  body('audioMime')
    .optional()
    .isString()
    .withMessage('Mime type do audio deve ser texto.'),

  body('modelKey')
    .optional()
    .isString()
    .withMessage('ModelKey deve ser texto.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados invalidos.',
        details: errors.array().map(e => e.msg)
      });
    }
    next();
  }
];

export const validateLogin = [
  body('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Usuario obrigatorio.')
    .isLength({ max: 50 })
    .withMessage('Usuario muito longo.'),

  body('password')
    .isString()
    .notEmpty()
    .withMessage('Senha obrigatoria.')
    .isLength({ max: 100 })
    .withMessage('Senha muito longa.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados invalidos.',
        details: errors.array().map(e => e.msg)
      });
    }
    next();
  }
];