const csv = require('csvtojson');
const parseQFXtoJSON = require('ofx-js').parse;
const fs = require('fs');

// Original data
const data_1 = './data/input/transactions_debit_1.csv';
const data_2 = './data/input/transactions_debit_2.csv';
const data_3 = './data/input/transactions_debit.QFX';
const locationFile = './data/input/2017_Gaz_place_national.txt';
const locationFile2 = './data/input/uscitiesv1.4.csv';
const wordVecsData = './data/input/glove.txt';

// Formatted data
const categories = require('./data/categories.json');
const locations = require('./data/uscitiesv1.4.json');
const transactions = require('./data/transactions_1.json');
const wordVecs = require('./data/glove.json');

function formatCSVData(fileLocation) {
    // console.log(fileLocation);
    const csvData = fs.readFile(fileLocation, 'UTF-8', (err, csvParsed) => {
        csv()
            // .fromFile(data_1)
            .fromString(csvParsed)
            .then(jsonData => {
                // dressData(jsonData);

                // Remove some special characters
                Object.keys(jsonData).forEach((transaction, i) => {
                    jsonData[i].Description = jsonData[i].Description.replace('\`', '\'');
                });

                fs.writeFile('./data/transactions_1.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;
                    console.log('CSV -> JSON data has been saved!');
                });
            });
    });
}

function formatQFXData(fileLocation) {
    const qfxData = fs.readFile(fileLocation, 'UTF-8', (err, qfxParsed) => {
        if (err) throw err;

        parseQFXtoJSON(qfxParsed)
            .then(jsonData => {

                fs.writeFile('./data/qfx_transactions.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;

                    console.log('QFX -> JSON data has been saved!');
                }); 
            })
            .catch(err => console.log('Error:', err));
    });
}

function formatCityData(locationFile) {
    fs.readFile(locationFile, 'UTF-8', (err, data) => {
        if (err) throw err;

        const legend = data.split(/[\r\n]/)[0].trim().split(/\t/);
        locationData = data.split(/[\r\n]/).map(location => { 
            const locMeta = location.split(/\t/).map(token => token.trim());
            const locObj = {};
            legend.forEach((key, i) => locObj[key] = locMeta[i]);
            return locObj;
        });

        locationData.shift();

        if (!locationData[locationData.length - 1].USPS) {
            locationData.pop();
        }

        fs.writeFile('./data/cities_us_2018.json', JSON.stringify(locationData, null, 4), null, err => {
            if (err) throw err;
            console.log('City data has been saved!');
        });
    });
}

function formatCityData2(locationFile) {
    fs.readFile(locationFile, 'UTF-8', (err, data) => {
        if (err) throw err;

        csv()
            // .fromFile(data_1)
            .fromString(data)
            .then(jsonData => {
                fs.writeFile('./data/uscitiesv1.4.json', JSON.stringify(jsonData, null, 4), null, err => {
                    if (err) throw err;
                    console.log('CSV -> JSON data has been saved!');
                });
            });
    });
}

function formatWordVecs(wordVecs) {
    // let wv = [];
    let wv = {};
    
    fs.readFile('./data/input/glove.txt', 'UTF-8', (err, vecs) => {
        vecs.trim().split(/[\r\n]/).forEach(vec => {
            let vectors = vec.split(/\s+/);
            let word = vectors.shift();
            vectors = vectors.map(vector => parseFloat(vector));

            wv[word] = vectors;
            // wv.push({ [word]: vectors });
        });

        fs.writeFile('./data/glove.json', JSON.stringify(wv, null, 4), null, err => {
            if (err) throw err;
            console.log('GloVe -> JSON data has been saved!');
        })
    });
}   

function dressData() {
    // transaction.meta = {
    //     account: string,
    //     channel: string,
    //     location: {
    //         city: string,
    //         lat: string,
    //         long: string,
    //         state: string
    //     },
    //     merchant: {
    //         name: string,
    //         website: string
    //     }
    // }

    let catVecs = categories.map(cat => ({ name: cat, mean: vectorizePhrase(cat.name) }));
    
    transactions.forEach((transaction, i) => {
        // if (i > 2) return;
        const meta = {}


        // #TODO - reference lookup table of most common merchants to save on computation


        // Gather a few data points
        let descriptor = transaction.Description.replace(/\s+/g, ' ');
        let state = descriptor.slice(-3).match(/\s{1}\D{2}/g);
        let merchant = descriptor.toUpperCase();

        // Extract Channel based on specific keywords
        // #TODO make this work witih more banks than just PNC
        const channels = {
            'ACH': /^ACH (CREDIT|DEBIT|WEB\D?RECUR|WEB\D?SINGLE)?\s+[a-zA-Z0-9]+/,
            'ATM': /^ATM (WITHDRAWAL|DEPOSIT)\sFEE?/,
            'CHECK': /^CHECK\s+\d+\s+\d+/,
            'DEBIT CARD PURCHASE': /^DEBIT CARD\s+(PURCHASE)?\s+X{4,5}\d{4,5}/,
            'ONLINE TRANSFER': /^ONLINE TRANSFER (TO|FROM)?\s+X+\d{4,5}/,
            'POS': /^(POS (PURCHASE|RETURN)?)?\s+POS[a-zA-Z0-9]+\s+\d+/,
        }

        Object.keys(channels).forEach((key, i) => {
            let match = descriptor.match(channels[key]);
            
            if (match) {
                meta.channel = key;

                if (['CHECK', 'ONLINE TRANSFER'].indexOf(key) === -1) {
                    merchant = merchant.split(match[0])[1].trim();
                } else {
                    merchant = '';
                }
            }
        });

        // Extract location
        if (state) {
            let cityState;
            let locMatch;
            state = state[0].slice(-2);
            
            // compare: RICHMOND VA => Richmond city VA
            const loc = locations
                .filter(location => location.state_id.toUpperCase() === state.toUpperCase())
                .find(location => {
                    cityState = location.city.toUpperCase() + ' ' + location.state_id.toUpperCase();
                    locMatch = merchant.toUpperCase().match(cityState);
                    return locMatch ? locMatch[0] : null;
                });

            if (loc) {
                merchant = merchant.toUpperCase().replace(loc.city.toUpperCase() + ' ' + loc.state_id.toUpperCase(), '').trim();
                meta.location = {
                    city: loc.city,
                    lat: loc.lat,
                    lng: loc.lng,
                    state: loc.state_id
                }
            } else {
                merchant = merchant.slice(0, -2).trim();
                meta.location = {
                    state: state
                }
            }
        }
        
        // Remove residual groupings of Xs and numbers
        merchant = merchant.replace(/X{4,5}\d{4,5}/, '').trim();
        
        // Remove franchise numbers
        merchant = merchant.replace(/(#|-)\s?(\d{1,5})*/, '').trim();
        merchant = merchant.replace(/\d*$/, '').trim();

        // Remove anything .com/.co
        merchant = merchant.replace(/\.CO(M)?\/?[A-Z0-9\/]*/, '').trim();

        // Replace unsubstantial characters
        merchant = merchant.replace(/\s(-|_)\s/, '').trim();

        // Convert words in merchant name to vectors & average words together
        if (merchant) {
            // console.log(merchant);
            let mean = vectorizePhrase(merchant);
            // console.log(mean);
            
            // Assess the cosine similarity between our merchant vector and category vectors
            if (!mean) {
                console.log(merchant, '=>', 'Not Categorized');
            } else {
                let categorize = catVecs
                    .map((catVec, i) =>  [ merchant, catVec.name, similarity(mean, catVec.mean) ])
                    .sort((a, b) => a[2] > b[2] ? 1 : -1)
                    .reverse()[0];

                console.log(merchant, '=>', categorize[1].name);
            }
        }

        meta.merchant = merchant;
        transaction.meta = meta;
    });
}

function vectorizePhrase(phrase) {
    let tokens = phrase.toLowerCase().split(/\s+/);
    let count = 0;

    let tkns = tokens
        .map(token => wordVecs[token])
        .filter(wordVec => wordVec !== undefined)
        .reduce((acc, val, i, arr) => {
            count = i + 1;
            // if (i === 0) return acc;

            for (let j = 0; j < acc.length; j++) {
                acc[j] += val[j];
            }

            return acc || [];
        }, new Array(50).fill(0));

        if (tkns) {
            tkns = tkns.map((wordVec, i, arr) => wordVec /= count);
        }

        return tkns;
}

function dotproduct(a,b) {
    let n = 0;
    let lim = Math.min(a.length,b.length);
    
    for (let i = 0; i < lim; i++) {
        n += a[i] * b[i];
    }

    return n;
 }

function norm2(a) {
    let sumsqr = 0;
    
    for (let i = 0; i < a.length; i++) { 
        sumsqr += a[i]*a[i];    
    }

    return Math.sqrt(sumsqr);
}

function similarity(a, b) {
    return dotproduct(a,b)/norm2(a)/norm2(b);
}

// formatQFXData(data_3);
// formatCSVData(data_1);
// formatCityData(locationFile);
// formatCityData2(locationFile2);
// formatWordVecs(wordVecsData);
dressData();
