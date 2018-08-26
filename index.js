const csv = require('csvtojson');
const parseQFXtoJSON = require('ofx-js').parse;
const fs = require('fs');

const data_1 = './data/input/transactions_debit_1.csv';
const data_2 = './data/input/transactions_debit_2.csv';
const data_3 = './data/input/transactions_debit.QFX';
const locationFile = './data/input/2017_Gaz_place_national.txt';
const locationFile2 = './data/input/uscitiesv1.4.csv';

let channels = [
    'ACH',
    // 'ACH CREDIT',
    // 'ACH DEBIT',
    'ATM',
    'CHECK',
    'CREDIT',
    'DEBIT',
    'DEPOSIT',
    'ONLINE TRANSFER',
    'PAYMENT',
    'POS PURCHASE'
];
let locations;
// let locationsCache = [];
let transactions;

function init() {
    fs.readFile('./data/uscitiesv1.4.json', 'UTF-8', (err, locations) => {
        if (err) throw err;
        locations = JSON.parse(locations);
        
        fs.readFile('./data/transactions_1.json', 'UTF-8', (err, transactions) => {
            transactions = JSON.parse(transactions);
            
            dressData(locations, transactions);
        });
    });
}

function formatCSVData(fileLocation) {
    // console.log(fileLocation);
    const csvData = fs.readFile(fileLocation, 'UTF-8', (err, csvParsed) => {
        csv()
            // .fromFile(data_1)
            .fromString(csvParsed)
            .then(jsonData => {
                dressData(jsonData);

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

function dressData(locations, transactions) {
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

    transactions.forEach((transaction, i) => {
        const meta = {}

        // Gather a few data points
        let descriptor = transaction.Description.replace(/\s+/g, ' ');
        let state = descriptor.slice(-3).match(/\s{1}\D{2}/g);
        let merchant = descriptor;

        // Extract Channel
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
                .filter(location => location.state_id.toLowerCase() === state.toLowerCase())
                .find(location => {
                    cityState = location.city.toLowerCase() + ' ' + location.state_id.toLowerCase();
                    locMatch = merchant.toLowerCase().match(cityState);
                    return locMatch ? locMatch[0] : null;
                });

            if (loc) {
                merchant = merchant.toLowerCase().replace(loc.city.toLowerCase() + ' ' + loc.state_id.toLowerCase(), '').trim();
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
        } else {
            // console.log('NO LOCATION IS APPLICABLE:', descriptor);
        }

        // Sometimes there is a state paired with an account number
        if (merchant) {
            let acc = merchant.match(/X{4,5}\d{4,5}/);

            if (acc) {
                merchant = merchant.replace(acc, '').trim();
            }
        }

        console.log(i, merchant);
        meta.merchant = merchant;
        transaction.meta = meta;
    });
}

function levenshteinDistance(a, b) {
    return a;
}

// formatQFXData(data_3);
// formatCSVData(data_1);
// formatCityData(locationFile);
// formatCityData2(locationFile2);
init();