// ============================================
// HERMES AI — Middleware de Sanitização
// Limpa e valida inputs antes de processar
// Analogia: detector de metais na entrada —
// remove objetos perigosos antes de deixar passar
// ============================================

import { body, validationResult } from 'express-validator'

// Regras de validação para a rota /api/chat
export const validateChat = [
  body('message')
    .optional()
    .isString()
    .withMessage('Mensagem deve ser texto.')
    .trim()
    // Limite de 8000 caracteres — evita sobrecarga no modelo
    .isLength({ max: 8000 })
    .withMessage('Mensagem muito longa. Máximo: 8000 caracteres.')
    // Remove tags HTML — evita XSS
    // XSS = Cross-Site Scripting = injeção de código malicioso
    .escape(),

  body('history')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Histórico inválido. Máximo: 50 mensagens.'),

  body('history.*.role')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('Role inválido no histórico.'),

  body('history.*.content')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 8000 })
    .withMessage('Conteúdo do histórico muito longo.'),

  body('image')
    .optional()
    .isString()
    .withMessage('Imagem deve ser string base64.'),

  // Middleware que verifica se houve erros de validação
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: errors.array().map(e => e.msg)
      })
    }
    next()
  }
]

// Regras de validação para a rota /api/auth/login
export const validateLogin = [
  body('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Usuário obrigatório.')
    .isLength({ max: 50 })
    .withMessage('Usuário muito longo.'),

  body('password')
    .isString()
    .notEmpty()
    .withMessage('Senha obrigatória.')
    .isLength({ max: 100 })
    .withMessage('Senha muito longa.'),

  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: errors.array().map(e => e.msg)
      })
    }
    next()
  }
]