const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Carregar arquivo YAML
const swaggerDocument = YAML.load(path.join(__dirname, '../../swagger.yaml'));

const options = {
  definition: swaggerDocument,
  apis: [], // Não precisamos de annotations já que temos o YAML completo
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: `
    .topbar-wrapper img {
      content: url('https://img.icons8.com/fluency/48/000000/truck.png');
      width: 40px;
      height: auto;
    }
    .swagger-ui .topbar { 
      background-color: #2c3e50; 
    }
    .swagger-ui .info .title {
      color: #2c3e50;
    }
  `,
  customSiteTitle: "Sistema de Transportadoras - API Documentation"
};

module.exports = {
  swaggerUi,
  swaggerDocument,
  swaggerOptions
};