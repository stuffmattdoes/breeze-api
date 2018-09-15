function notFound (req, res, next) {
    res.status( 404 );

    res.json({
        status: res.statusCode,
        message: 'No resource exists at this route.'
    });
}

module.exports = notFound;
