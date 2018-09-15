'use strict';

const logger = require('./winston');

function errorHandler(err, req, res, next) {
    const errorStatus = err.status || 500;

    // console.log('Error:', err);

    if (res.statusCode == 200) {
        res.status(errorStatus);
    }

    const responseError = {
        errorCode: err.errorCode,
        errors : err.errors || null,
        message: err.message || null,
        status: res.statusCode,
        raw: err._raw || null
    };

	logger.log('error', responseError);

    if (err.stack) {
        console.log( err.stack );
    }

    res.json(responseError);
}

module.exports = errorHandler;
