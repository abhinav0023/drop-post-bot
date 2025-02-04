import {Telegraf} from 'telegraf';
import userModel from './src/models/user.js'

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {

    const from = ctx.update.message.from;
    console.log(from);
    try{
        await userModel.findOneAndUpdate({tgId: from.id},{
            $setOnInsert: {
                firstName: from.first_name,
                lastName: from.last_name,
                isBot: from.is_bot,
                tgId: from.id
            }
        },{upsert:true, new:true});
        // store the user information into db
        await ctx.reply("Hi!, ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you Just keep feeding me with the events throught the day . Lets shine on social media ")
    }catch(err){
        console.log(err);
        await ctx.reply("Error occurred while storing user data. Please try again later.");
    }
});


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))