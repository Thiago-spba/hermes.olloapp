import { body, validationResult } from 'express-validator';

// Remove caracteres perigosos (prevenir XSS)
export const sanitizeText = (text) => {
  if (!text) return text;
  // Remove tags HTML/script
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/onclick=/gi, '')
    .replace(/onerror=/gi, '')
    .replace(/onload=/gi, '')
    .trim();
};

export const validateChat = [
  body('message')
    .optional()
    .isString()
    .withMessage('Mensagem deve ser texto.')
    .trim()
    .isLength({ min: 0, max: 10000 })
    .withMessage('Mensagem muito longa (max 10.000 caracteres).')
    .customSanitizer(value => sanitizeText(value)),
  
  body('audio')
    .optional()
    .isString()
    .withMessage('Audio invalido.')
    .isLength({ max: 5000000 })
    .withMessage('Audio muito grande (max 5MB).'),
  
  body('image')
    .optional()
    .isString()
    .withMessage('Imagem invalida.')
    .isLength({ max: 10000000 })
    .withMessage('Imagem muito grande (max 10MB).'),
  
  body('modelKey')
    .optional()
    .isString()
    .matches(/^(auto|thiago-analiza|thiago-jr|thiago-senior|thiago-doutor|thiago-especialista|thiago-supremo)$/)
    .withMessage('Modelo invalido.'),
  
  body('studyMode')
    .optional()
    .isBoolean()
    .withMessage('Modo estudo deve ser booleano.'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dados invalidos.', 
        details: errors.array().map(e => e.msg) 
      });
    }
    
    // Log de tentativas suspeitas
    const message = req.body.message || '';
    const suspiciousPatterns = ['<script', 'alert(', 'eval(', 'document.cookie'];
    if (suspiciousPatterns.some(pattern => message.toLowerCase().includes(pattern))) {
      console.warn(`⚠️ Tentativa de XSS detectada do IP: ${req.ip}`);
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
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario deve ter entre 3 e 50 caracteres.')
    .matches(/^[a-zA-Z0-9@._-]+$/)
    .withMessage('Usuario contem caracteres invalidos.'),
  
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Senha obrigatoria.')
    .isLength({ min: 6, max: 100 })
    .withMessage('Senha deve ter entre 6 e 100 caracteres.'),
  
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
