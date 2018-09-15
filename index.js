'use strict';

// Set environment variable
const ROOT_DIR = process.env.ROOT_DIR = __dirname;

// Modules
const cors = require('cors');
// const db = require(`${ROOT_DIR}/config/mongoose`);
const errorHandler = require(`${ROOT_DIR}/config/error`);
const express = require('express');
const notFound = require(`${ROOT_DIR}/config/notFound`);
const parser = require('body-parser');
const routes = require(`${ROOT_DIR}/src`);

// variables
const SERVER_PORT = process.env.PORT || 3001;

// Create an express instance
const app = express();

// Parse url encoded responses into JSON
app.use(parser.json());
app.use(parser.urlencoded({ extended: false }));

// CORS
app.use(cors());
app.options('*');

// Create API routes
// domain.com/api
app.use('/api', routes);

// Configure Error Handling
app.use(errorHandler);

// 404 missing resource
app.use('*', notFound);

// Start the server
const server = app.listen(SERVER_PORT, () => {
    console.log(`The server is running on port: ${SERVER_PORT}`);
});

module.exports = server;
