// notbot by notchris (https://github.com/notchris)

const irc = require("irc");
const malScraper = require('mal-scraper')
const animeQuotes = require("animequotes");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const fetch = require('node-fetch');

const adapter = new FileSync('db.json')
const db = low(adapter)

const config = {
    channels: ["##notchris"],
    server: "chat.freenode.net",
    botName: "notbot"
};

//// Random utility functions

// RTD
const dice = {
    sides: 6,
    roll: function() {
        var randomNumber = Math.floor(Math.random() * this.sides) + 1;
        return randomNumber;
    }
}

// Init bot
const bot = new irc.Client(config.server, config.botName, {
    channels: config.channels
})

// Listen for messages
bot.addListener("message", function(from, to, text, message) {
    let msg = message.args[1];

    // JSON example

    if (msg.startsWith('!ip')) {
        let ip = msg.split('!ip')[1];
        ip = ip.trim()
        let url = 'http://ip-api.com/json/' + ip;
        fetch(url)
            .then(res => res.json())
            .then(function(json){
                console.log(json)
                bot.say(config.channels[0], `Location: ${json.city},${json.country}`);
            })
    }

    // Give stars
    if (msg.endsWith('++')) {
        let name = msg.split('++')[0];
        let users = Object.keys(bot.chans[config.channels[0]].users);

        if (name !== from) {
            if (users.includes(name)) {
                let targetUser = db.get('users').find({ name: name }).value()
                if (targetUser) {
                    db.get('users').find({ name: name }).assign({ stars: targetUser.stars + 1}).write()
                    bot.say(config.channels[0], `${from} gave ${name} a ★ || ${name} has ★ ${targetUser.stars + 1}`);
                } else {
                    db.get('users').push({ name: name, stars: 1}).write()
                    bot.say(config.channels[0], `${from} gave ${name} a ★ || ${name} has ★ 1`);
                }
            } else {
                bot.say(config.channels[0], `I couldn't find the user '${name}' in the channel.`);
            }
        } else {
            bot.say(config.channels[0], `You can't give yourself stars.`);
        }
    }

    // List stars
    if (msg.startsWith('!stars')) {
        let name = msg.split('!stars')[1];
        name = name.trim()
        let targetUser = db.get('users').find({ name: name }).value()
        if (targetUser) {
            bot.say(config.channels[0], `${name} has ★ ${targetUser.stars}`);
        } else {
            bot.say(config.channels[0], `I couldn't find the user '${name}'.`);
        }
    }

    // List top 10
    if (msg.startsWith('!top')) {
        let filtered = db.get('users').sortBy('stars').take(10).value()
        let top = filtered.reverse()
        let list = '';
        top.forEach(function (u,i) {
            if (i === top.length - 1) {
               list += `${u.name} [${u.stars} ★]`
            } else {
               list += `${u.name} [${u.stars} ★] || ` 
            }
        })
        bot.say(config.channels[0], `Top users: ${list}`);
    }

    // Anime quotes
    if (msg.startsWith('!quote')) {
        let name = msg.split('!quote')[1]
        if (name !== '' && name !== null) {
            // Get quote by requested anime
            let quote = animeQuotes.getQuotesByAnime(name.trim())
            if (quote.length) {
                let q = quote[Math.floor(Math.random() * quote.length)]
                bot.say(config.channels[0], '"' + q.quote + '"' + ' - ' + q.name + ' (' + q.anime + ')');
            } else {
                bot.say(config.channels[0], `I couldn't find any quotes for the anime '${name}'.`);
            }

        } else {
            // Get random quote
            let quote = animeQuotes.randomQuote()
            bot.say(config.channels[0], '"' + quote.quote + '"' + ' - ' + quote.name + ' (' + quote.anime + ')');
        }
    }
    // Roll the dice
    if (msg.startsWith('!rtd')) {
        let roll = dice.roll()
        bot.say(config.channels[0], '🎲 ' + from + ' rolled a ' + roll + '.');
    }
    // Anime information
    if (msg.startsWith('!anime')) {
        let name = msg.split('!anime')[1];
        malScraper.getInfoFromName(name)
            .then(function(data) {
                bot.say(config.channels[0], `${data.title} | Episodes: ${data.episodes} | Status: ${data.status} | Aired: ${data.aired} | Score: ${data.score} / 10 | URL: ${data.url}`);
            }).catch(function(err) {
                bot.say(config.channels[0], `I could not find any anime with the title "${name}".`);
            })
    }
})

bot.addListener('error', function(message) {
    console.log('error: ', message);
})