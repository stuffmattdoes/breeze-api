const ENV_CONFIG = {
    DB_URL: 'postgres://wwgiqwbl:foC0C3kZOpOFrruktA9vKDTLtJFePyYf@elmer.db.elephantsql.com:5432/wwgiqwbl',
    DB_USER: 'wwgiqwbl',
    DB_PW: 'foC0C3kZOpOFrruktA9vKDTLtJFePyYf',
    JWT_DURATION: (60 * 60 * 24),    // 86,400 seconds = 24 hours
    JWT_SECRET: 'X(*I$0isdj0fif9op2FHKL&*IslWP}',
}

module.exports = {
    env: ENV_CONFIG,
}
