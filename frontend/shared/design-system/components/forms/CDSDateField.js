const { createVariant } = require('../../utils/createVariant');
const Primitive = require('../../primitives/form/Input');
module.exports = createVariant(Primitive, {'type':'date'});
