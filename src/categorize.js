// Data
const categories = require('../data/categories_full.json');
const locations = require('../data/uscitiesv1.4.json');
const wordVecs = require('../data/glove.json');

function categorize(transaction) {
    if (transaction.category) {
        return categoryLearn(transaction);
    } else {
        return categoryAssign(transaction);
    }
}

function categoryLearn(transaction) {
    console.log('Learned!');
    return transaction;
}

function categoryAssign(transaction) {
    let nextTransaction = {
        amount: transaction.amount,
        category: null,
        channel: null,
        currency: 'USD',
        date: transaction.date,
        descriptor: transaction.descriptor,
        id: transaction.id,
        location: {
            city: null,
            lat: null,
            long: null,
            state: null
        },
        merchant: null
    }


    // #TODO - reference lookup table of most common merchants to save on computation


    // Gather a few data points
    let state = nextTransaction.descriptor.slice(-3).match(/\s\D{2}/g);
    let merchant = nextTransaction.descriptor.toUpperCase();

    // Extract Channel based on specific keywords
    // #TODO make this work witih more banks than just PNC
    const channels = {
        'ACH': /^ACH (CREDIT|DEBIT|WEB\D?RECUR|WEB\D?SINGLE)?\s+[a-zA-Z0-9]+/,
        'ATM': /^ATM (WITHDRAWAL|DEPOSIT)\s(FEE)?/,
        'CHECK': /^CHECK\s+\d+\s+\d+/,
        'DEBIT CARD PURCHASE': /^DEBIT CARD\s+(PURCHASE)?\s+X{4,5}\d{4,5}/,
        'ONLINE TRANSFER': /^ONLINE TRANSFER (TO|FROM)?\s+X+\d{4,5}/,
        'POS': /^(POS (PURCHASE|RETURN)?)?\s+POS[a-zA-Z0-9]+\s+\d+/,
    }

    // Extract channel
    Object.keys(channels).forEach((channel, i) => {
        let match = nextTransaction.descriptor.match(channels[channel]);
        
        if (match) {
            nextTransaction.channel = channel;

            switch(channel) {
                case 'CHECK':
                    nextTransaction.category = '5ac99414aed9e75be6acbb01';
                    merchant = channel;
                    break;   
                case 'ATM': 
                case 'ONLINE TRANSFER':
                    nextTransaction.category = '5ac9b24d3f3b4665f3e1edb5';
                    merchant = channel;
                    break;
                default:
                    merchant = merchant.split(match[0])[1].trim();
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
            nextTransaction.location = {
                city: loc.city,
                lat: loc.lat,
                lng: loc.lng,
                state: loc.state_id
            }
        } else {
            merchant = merchant.slice(0, -2).trim();
            nextTransaction.location = {
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

    // Replace unsubstantial characters & characters following them
    merchant = merchant.replace(/\s(-|_)\s.*/, '').trim();

    // Convert words in merchant name to vectors & average words together
    if (merchant && !transaction.category) {
        let mean = vectorizePhraseMean(getWordEmbeddings(merchant));
        
        // 
        // Assess the cosine similarity between our merchant vector and category vectors
        if (mean) {
            let categorize = categories
                .map((category, i) => {
                    return {
                        category,
                        merchant, 
                        similarity: similarity(mean, category.vex)
                    }
                })
                .sort((a, b) => a.similarity > b.similarity ? 1 : a.similarity < b.similarity ? -1 : 0)
                .reverse()[0];

            nextTransaction.category = categorize.category.id
        } else {
            nextTransaction.category = '5ac99414aed9e75be6acbb01';
        }

        nextTransaction.merchant = merchant;
    }

    console.log('Assigned!');
    return nextTransaction;
}

function getWordEmbeddings(phrase) {
    let tokens = phrase.toLowerCase().split(/\s+/);

    return tokens
        .map(token => wordVecs[token])
        .filter(wordVec => wordVec !== undefined)
        .reduce((acc, val, i, arr) => {
            // if (i === 0) return acc;

            for (let j = 0; j < acc.length; j++) {
                acc[j] += val[j];
            }

            return acc || [];
        }, new Array(50).fill(0));
}

function vectorizePhraseMean(tokens) {
    return tokens.map(wordVec => wordVec /= tokens.length);
}

function dotproduct(a, b) {
    let n = 0;
    let lim = Math.min(a.length, b.length);
    
    for (let i = 0; i < lim; i++) {
        n += a[i] * b[i];
    }

    return n;
 }

function norm2(a) {
    let sumsqr = 0;
    
    for (let i = 0; i < a.length; i++) { 
        sumsqr += a[i] * a[i];    
    }

    return Math.sqrt(sumsqr);
}

function similarity(a, b) {
    return dotproduct(a, b) / norm2(a) / norm2(b);
}

module.exports = categorize;