const handlerModule = require('../dist/api/index');
const handler = handlerModule.default || handlerModule;

module.exports = handler;
