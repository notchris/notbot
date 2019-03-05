// notbot by notchris (https://github.com/notchris)

const irc = require("irc");
const malScraper = require('mal-scraper')
const animeQuotes = require("animequotes");

const config = {
    channels: ["##anime"],
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
});