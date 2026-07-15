const express = require('express');
const db = require('../../../database');
const Muc = require('../index');

const router = express.Router({ mergeParams: true });

function handleError(res, err) {
  const status = err.status || 500;
  console.error('[MUC]', err.message);
  return res.status(status).json({ error: err.message });
}

router.get('/', async (req, res) => {
  try {
    const produtoId = Number(req.params.id || req.params.produtoId);
    const unidades = await Muc.listar(db, produtoId);
    res.json(unidades);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/', async (req, res) => {
  try {
    const produtoId = Number(req.params.id || req.params.produtoId);
    const unidade = await Muc.criar(db, produtoId, req.body || {});
    res.status(201).json(unidade);
  } catch (err) {
    handleError(res, err);
  }
});

router.put('/:unidadeId', async (req, res) => {
  try {
    const produtoId = Number(req.params.id || req.params.produtoId);
    const unidadeId = Number(req.params.unidadeId);
    const unidade = await Muc.atualizar(db, produtoId, unidadeId, req.body || {});
    res.json(unidade);
  } catch (err) {
    handleError(res, err);
  }
});

router.delete('/:unidadeId', async (req, res) => {
  try {
    const produtoId = Number(req.params.id || req.params.produtoId);
    const unidadeId = Number(req.params.unidadeId);
    const result = await Muc.excluir(db, produtoId, unidadeId);
    res.json(result);
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/:unidadeId/principal', async (req, res) => {
  try {
    const produtoId = Number(req.params.id || req.params.produtoId);
    const unidadeId = Number(req.params.unidadeId);
    const unidade = await Muc.marcarPrincipal(db, produtoId, unidadeId);
    res.json(unidade);
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
