import { body, validationResult } from 'express-validator';

// Remove scripts maliciosos sem quebrar códigos ou símbolos matemáticos
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .trim();
};

export const validateChat = [
  body('message')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Mensagem deve ser texto.')
    .trim()
    .isLength({ max: 100000 })
    .withMessage('Mensagem muito longa.')
    .customSanitizer(value => sanitizeText(value)),

  body('history')
    .optional()
    .isArray()
    .withMessage('Histórico deve ser uma lista.'),

  body('audio')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Áudio inválido.'),

  body('audioMime')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Formato de áudio inválido.'),

  body('image')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Imagem inválida.'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Lista de imagens inválida.'),

  body('modelKey')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Modelo inválido.'),

  body('studyMode')
    .optional()
    .isBoolean()
    .withMessage('Modo estudo deve ser booleano.'),

  body('useRAG')
    .optional()
    .isBoolean()
    .withMessage('useRAG deve ser booleano.'),

  body('projectContext')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Contexto do projeto deve ser texto.')
    .isLength({ max: 100000 }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('⚠️ Validação falhou no chat:', errors.array().map(e => e.msg));
      return res.status(400).json({ 
        error: 'Dados inválidos.', 
        details: errors.array().map(e => e.msg) 
      });
    }

    // Alerta de segurança preventivo
    const message = typeof req.body.message === 'string' ? req.body.message : '';
    if (message.toLowerCase().includes('<script')) {
      console.warn(`⚠️ Tentativa de injeção detectada do IP: ${req.ip}`);
    }

    next();
  }
];

export const validateLogin = [
  body('username')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Usuário obrigatório.')
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuário deve ter entre 3 e 50 caracteres.')
    .matches(/^[a-zA-Z0-9@._-]+$/)
    .withMessage('Usuário contém caracteres inválidos.'),

  body('password')
    .isString()
    .notEmpty()
    .withMessage('Senha obrigatória.')
    .isLength({ min: 6, max: 100 })
    .withMessage('Senha deve ter entre 6 e 100 caracteres.'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados inválidos.', 
        details: errors.array().map(e => e.msg) 
      });
    }
    next();
  }
];