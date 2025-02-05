import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import userModel from "./src/models/user.js";
import connectDb from "./src/config/db.js";
import eventModel from "./src/models/events.js";
import dotenv from "dotenv";
dotenv.config(); // Load .env file

// Initialize Telegram bot instance with provided token
const bot = new Telegraf(process.env.BOT_TOKEN);

// Connect to MongoDB database
try {
  connectDb();
} catch (e) {
  console.log(e);
  process.kill(process.pid, "SIGTERM");
}

// Handle start command
bot.start(async (ctx) => {
  const from = ctx.update.message.from;
  console.log(from);
  // Check if user already exists in the database, if not, insert new user record.
  try {
    await userModel.findOneAndUpdate(
      { tgId: from.id },
      {
        $setOnInsert: {
          firstName: from.first_name,
          lastName: from.last_name || "",
          username: from.username || "",
          isBot: from.is_bot,
          tgId: from.id,
        },
      },
      { upsert: true, new: true }
    );
    await ctx.reply(
      `Hi!, ${from.first_name}, Welcome. I will be writing highly engaging social media posts for you Just keep feeding me with the events throught the day . Lets shine on social media `
    );
  } catch (err) {
    console.log(err);
    await ctx.reply(
      "Error occurred while storing user data. Please try again later."
    );
  }
});

bot.on(message("text"), async (ctx) => {
  const from = ctx.update.message.from;
  const message = ctx.update.message.text;

  try {
    await eventModel.create({
      text: message,
      tgId: from.id,
    });
    await ctx.reply("Got it, keep sending thoughts. To generate the posts, just enter the command: /generate");
  } catch (err) {
    console.log(err);
    await ctx.reply(
      "Error occurred while processing your message. Please try again later."
    );
  }
});

bot.launch();
// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
