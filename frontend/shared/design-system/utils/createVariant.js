/**
 * Cria componente oficial com variante padrão a partir de um primitivo.
 *
 * @module frontend/shared/design-system/utils/createVariant
 */

function createVariant(Primitive, defaults = {}) {
  return class VariantComponent {
    static create(options = {}) {
      return Primitive.create({ ...defaults, ...options });
    }

    static getStyles() {
      return Primitive.getStyles ? Primitive.getStyles() : '';
    }
  };
}

function createAlias(Primitive) {
  return class AliasComponent {
    static create(options = {}) {
      return Primitive.create(options);
    }

    static getStyles() {
      return Primitive.getStyles ? Primitive.getStyles() : '';
    }
  };
}

module.exports = { createVariant, createAlias };
