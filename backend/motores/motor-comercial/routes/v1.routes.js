/**
 * Rotas Versionadas do Motor Comercial — API REST v1.
 *
 * Sprint 2.5: API REST — versionamento de rotas.
 *
 * @module motores/motor-comercial/routes/v1.routes
 */

const express = require('express');
const comercialRoutes = require('./comercial.routes');

const router = express.Router();

// Monta as rotas do motor comercial sob /api/v1/comercial
router.use('/comercial', comercialRoutes);

module.exports = router;
