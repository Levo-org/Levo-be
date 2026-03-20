const path = require('path');

const handlerModule = require(path.join(process.cwd(), 'dist', 'api', 'index'));
const handler = handlerModule.default || handlerModule;

module.exports = handler;
