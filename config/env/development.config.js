const ENV_CONFIG = {
    DB_URL: 'DB_URL',
    DB_USER: 'DB_USER',
    DB_PW: 'DB_PW',
    JWT_DURATION: (60 * 60 * 24),    // 86,400 seconds = 24 hours
    JWT_SECRET: 'X(*I$0isdj0fif9op2FHKL&*IslWP}',
}

module.exports = {
    env: ENV_CONFIG,
}
