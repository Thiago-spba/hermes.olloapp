// ============================================
// HERMES AI — Middleware de Sanitização
// Limpa e valida inputs antes de processar
// Analogia: detector de metais na entrada —
// remove objetos perigosos antes de deixar passar
// ============================================

import { body, validationResult } from 'express-validator';

// Regras de validação para a rota /api/chat
export const validateChat = [
  body('message')
    .optional()
    .isString()
    .withMessage('Mensagem deve ser texto.')
    .trim()
    // Limite aumentado para 50000 caracteres (~25 paginas)
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

  body('history.*.content')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50000 })
    .withMessage('Conteudo do historico muito longo.'),

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

  // Middleware que verifica se houve erros de validacao
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

// Regras de validacao para a rota /api/auth/login
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