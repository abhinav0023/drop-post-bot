import {Telegraf} from 'telegraf';
import userModel from './src/models/user.js'

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {

    const from = ctx.update.message.from;
    console.log(from);

    
    // store the user information into db
    await ctx.reply("welcome to drop post bot! 🚀")
});


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))