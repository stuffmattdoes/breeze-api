const fs = require('fs');
const path = require('path');

function getAll(req, res, next) {
    const categories = require(path.join(__dirname, '..', '..','data', 'categories.json'))
        .map(category => {
            let cat = category;
            delete cat['vectors'];
            return cat;
        });

    res.locals.categories = categories;
    return next();
}

module.exports = {
    getAll
}