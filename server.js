// importing 
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import userModel from "./src/models/user.js";
import connectDb from "./src/config/db.js";
import eventModel from "./src/models/events.js";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";


dotenv.config(); // Load .env file

// Initialize Telegram bot instance with provided token
const bot = new Telegraf(process.env.BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

bot.command("generate", async (ctx) => {
  const from = ctx.update.message.from;
  
  const startDay = new Date();
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date();
  endDay.setHours(23, 59, 59, 999);

  try {
    const events = await eventModel.find({ 
      tgId: from.id,
      createdAt: {
        $gte: startDay,
        $lte: endDay
      }
    });

    if(events.length === 0) {
      await ctx.reply("No events found for the day.");
      return;
    }

    // Combine all events into a single prompt
    const combinedEvents = events.map(e => `- ${e.text}`).join('\n');
    const prompt = `Create social media posts based on these daily thoughts. Follow these guidelines:
    1. LinkedIn: Professional tone, 3-4 paragraphs, include relevant hashtags
    2. Facebook: Conversational tone, 2-3 paragraphs, emojis
    3. Twitter: Concise, 1-2 sentences max, trending hashtags
    4. All posts must be in the same language as the thoughts
    
    Thoughts:
    ${combinedEvents}

    Format your response:
    LinkedIn: [content]
    Facebook: [content]
    Twitter: [content]`;

    // Generate content with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Store token usage
    await userModel.findOneAndUpdate(
      { tgId: from.id },
      { $inc: { promptToken: response.usageMetadata?.totalTokenCount || 0 } }
    );

    // Split and send responses
    const platforms = generatedText.split(/\n(?=[A-Za-z]+:)/);
    await ctx.reply("Here are your social media posts for today:\n");
    
    for (const platformPost of platforms) {
      await ctx.reply(platformPost.trim());
      await new Promise(resolve => setTimeout(resolve, 500)); // Avoid rate limiting
    }

  } catch (err) {
    console.error(err);
    await ctx.reply("Error generating posts. Please try again later.");
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


