const express = require('express');
const router = express.Router();
const configService = require('../services/configuracaoService');
const { exigirSuperAdmin } = require('./auth');

router.get('/recursos', (req, res) => {
  try {
    res.json(configService.getRecursos());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', exigirSuperAdmin, (req, res) => {
  try {
    const cfg = configService.readConfig();
    res.json(Object.assign({}, cfg, { recursos: configService.getRecursos(cfg).recursos }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', exigirSuperAdmin, (req, res) => {
  try {
    const data = req.body || {};
    const validation = configService.validateConfig(data);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validação falhou',
        details: validation.errors
      });
    }

    const saved = configService.saveConfig(data);

    res.json({
      success: true,
      message: 'Configurações salvas com sucesso.',
      config: saved,
      recursos: configService.getRecursos(saved).recursos
    });
  } catch (err) {
    const status = err.details ? 400 : 500;
    res.status(status).json({
      error: err.message,
      details: err.details || undefined
    });
  }
});

module.exports = router;
