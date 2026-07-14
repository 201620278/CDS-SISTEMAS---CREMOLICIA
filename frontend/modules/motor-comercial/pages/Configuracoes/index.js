/**
 * Configurações do Motor Comercial — visão operacional (read-only).
 *
 * Sprint H-2: rota /configuracoes
 *
 * @module frontend/modules/motor-comercial/pages/Configuracoes
 */

const CadastroLayout = require('../../components/layouts/CadastroLayout');
const Button = require('../../components/base/Button');
const Card = require('../../components/base/Card');
const { getUsuarioLogado, possuiPermissao } = require('../../utils/autorizacao');
const { navigate } = require('../../utils/operacional');

const PERMISSOES_COMERCIAIS = [
  'COMERCIAL_VISUALIZAR',
  'COMERCIAL_CONSIGNACAO',
  'COMERCIAL_ACERTO',
  'COMERCIAL_LIMITE',
  'COMERCIAL_PERDAS',
  'COMERCIAL_CORTESIAS',
  'COMERCIAL_DASHBOARD'
];

class ConfiguracoesPage {
  static create() {
    const page = new ConfiguracoesPage();
    return page._render();
  }

  _render() {
    const user = getUsuarioLogado();
    const content = document.createElement('div');
    content.className = 'cds-configuracoes';

    const versionBody = document.createElement('p');
    versionBody.textContent = 'Módulo homologado para operação Cremolia (v1.0). Configurações estruturais são gerenciadas pela plataforma CDS.';
    content.appendChild(Card.create({
      header: Card.createHeader({ title: 'Motor Comercial — Versão 1.0' }),
      body: versionBody
    }));

    const userCard = document.createElement('div');
    userCard.className = 'cds-configuracoes__section';
    userCard.innerHTML = '<h3>Operador atual</h3>';
    if (user) {
      userCard.innerHTML += `
        <p><strong>${user.nome || user.username}</strong> (${user.perfil || user.role || 'USUARIO'})</p>
        <p>ID: ${user.id}</p>
      `;
    } else {
      userCard.innerHTML += '<p>Nenhum usuário autenticado.</p>';
    }
    content.appendChild(userCard);

    const permCard = document.createElement('div');
    permCard.className = 'cds-configuracoes__section';
    permCard.innerHTML = '<h3>Permissões comerciais</h3><ul></ul>';
    const list = permCard.querySelector('ul');
    PERMISSOES_COMERCIAIS.forEach((perm) => {
      const li = document.createElement('li');
      const ok = possuiPermissao(perm);
      li.textContent = `${perm}: ${ok ? 'concedida' : 'não concedida'}`;
      list.appendChild(li);
    });
    content.appendChild(permCard);

    const actions = document.createElement('div');
    actions.className = 'cds-configuracoes__actions';
    actions.appendChild(Button.create({ text: 'Voltar ao Painel', variant: 'primary', onClick: () => navigate('/') }));
    content.appendChild(actions);

    const header = document.createElement('div');
    header.innerHTML = '<h1>Configurações Comerciais</h1>';

    return CadastroLayout.create({ header, content });
  }
}

module.exports = ConfiguracoesPage;
