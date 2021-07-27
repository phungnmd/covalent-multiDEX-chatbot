const TelegramBot = require("node-telegram-bot-api");
const covalent = require("./covalent");
const { dexList,telegramToken } = require("./config");
const { formatNumber} = require("./utils");
const bot = new TelegramBot(telegramToken, { polling: true });

covalent.getPools(1,'sushiswap');
let users = {};
const dexMenu = {
  keyboard: [
    ["⚖️ Sushiswap"],
    ["⚖️ Quickswap", "⚖️ Spiritswap"],
    ["⚖️ Pangolin", "⚖️ Spookyswap"],
  ],
  resize_keyboard: true,
  force_reply: true,
};

//get list menu reply markup
function getFunctionMenu(dex) {
  return {
    keyboard: [
      ["⚖️ " + dex + " info"],
      ["💰 Liquidity", "📈 Volume"],
      ["🏦 Pools Data", "🪙 Tokens Data"],
      ["⬅️ Back to Menu"],
    ],
    resize_keyboard: true,
    force_reply: true,
  };
}

//get liquidity message template
async function getLiquidityMessage(page,data) {
  let message = `${data.items[0].dex_name.toUpperCase()} LIQUIDITY\n`;
    let liquidity_30d = data.items[0].liquidity_chart_30d;
    let fromIndex = liquidity_30d.length - page * 5 - 1;
    let toIndex = liquidity_30d.length - (page + 1) * 5 - 1;
    for (let i = fromIndex; i > toIndex && i > 0; i--) {
        message += `💰  ${liquidity_30d[i].dt.substr(0,10)} : $${formatNumber(liquidity_30d[i].liquidity_quote)}\n`;
    }
    return message;
}
//get volume message template
async function getVolumeMessage(page,data) {
    let message = `${data.items[0].dex_name.toUpperCase()} VOLUME\n`;
      let volume_30d = data.items[0].volume_chart_30d;
      let fromIndex = volume_30d.length - page * 5 - 1;
      let toIndex = volume_30d.length - (page + 1) * 5 - 1;
      for (let i = fromIndex; i > toIndex && i > 0; i--) {
          message += `📈  ${volume_30d[i].dt.substr(0,10)} : $${formatNumber(volume_30d[i].volume_quote)}\n`;
      }
      return message;
}
//get volume message template
async function getPoolsMessage(pool,dexName) {
  let message = `${dexName.toUpperCase()} POOLS\n`;
    message += `------------------------\n`;
    message += `<b>${pool.token_0.contract_ticker_symbol} - ${pool.token_1.contract_ticker_symbol}</b>\n`;
    message += `------------------------\n`;
    message += `💰 Liquidity :  $${formatNumber(pool.total_liquidity_quote)}\n`;
    message += `📈 Volume 24h :  $${formatNumber(pool.volume_24h_quote)}\n`;
    message += `📉 Volume 7D :  $${formatNumber(pool.volume_7d_quote)}\n`;
    message += `🏦 Base reverse :  ${formatNumber((pool.token_0.reserve/10**pool.token_0.contract_decimals).toFixed(2))} ${pool.token_0.contract_ticker_symbol}\n`;
    message += `🏦 Quote reverse : ${formatNumber((pool.token_1.reserve/10**pool.token_1.contract_decimals).toFixed(2))} ${pool.token_1.contract_ticker_symbol}\n`;
    message += `💸 Fees 24h :  $${formatNumber(pool.fee_24h_quote)}\n`;
    message += `💸 % Fees (Yearly) :  ${pool.annualized_fee.toFixed(5)}%\n`;
    return message;
}
//get volume message template
async function getTokensMessage(token,dexName) {
  let message = `${dexName.toUpperCase()} TOKENS\n`;
    message += `------------------------\n`;
    message += `<b>${token.contract_name} - $${token.contract_ticker_symbol}</b>\n`;
    message += `------------------------\n`;
    message += `⚖️ Price :  $${formatNumber(token.quote_rate.toFixed(4))}%\n`;
    message += `📉 Volume 24h :  $${formatNumber(token.total_volume_24h_quote)}%\n`;
    message += `💰 Liquidity :  $${formatNumber(token.total_liquidity_quote)}%\n`;
    return message;
}
//Get options for pagination buttons
function getPaginationMessageOption(command, page, lastPage, dexName) {
  let options = {
    reply_markup: {
      inline_keyboard: [[]],
    },
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (page > 0) {
    options.reply_markup.inline_keyboard[0].push({
      text: "<",
      callback_data: JSON.stringify({
        command: command,
        page: page - 1,
        dexName
      }),
    });
  }
  if (page < lastPage) {
    options.reply_markup.inline_keyboard[0].push({
      text: ">",
      callback_data: JSON.stringify({
        command: command,
        page: page + 1,
        dexName
      }),
    });
  }
  return options;
}
//handle error
function errorHandler(bot,chatId) {
    bot.sendMessage(chatId, "✋ Something went wrong, Choose your DEX", {
        reply_markup: dexMenu,
      });
}
//Select Dex
const dexRegex = new RegExp("^⚖️ (" + Object.keys(dexList).join("|") + ")$");
bot.onText(dexRegex, (msg, match) => {
  try {
    const dexName = match[1];
    const chatId = msg.chat.id;
    const dex = dexList[dexName];
    if (users[chatId]) {
      users[chatId].current_dex = dexName;
    } else {
      users[chatId] = {
        current_dex: dexName,
      };
    }
    bot.sendMessage(
      chatId,
      "⚖️ " + dexName + " Dashboard: Please select data to view",
      {
        reply_markup: getFunctionMenu(dexName),
      }
    );
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);

  }
});
//Get DEX Info
const dexInfoRegex = new RegExp(
  "⚖️ (" + Object.keys(dexList).join("|") + ") info"
);
bot.onText(dexInfoRegex, async (msg, match) => {
  try {
    const dexName = match[1];
    const dex = dexList[dexName];
    const chatId = msg.chat.id;
    //get dex info then send here

    const healthData = await covalent.getHealth(dex.chainID, dex.dexName);
    const infoData = await covalent.getInfo(dex.chainID, dex.dexName);

    const response_template = `⚖️ DEX : <a href="${dex.url}"> <b>${dexName.toUpperCase()}</b></a>
------------------------
💰 Total Liquidity :  $${formatNumber(
      infoData.data.items[0].volume_chart_7d[6].volume_quote
    )}
📈 Volume 24h :  $${formatNumber(
      infoData.data.items[0].volume_chart_7d[6].volume_quote
    )}
📉 Transactions 24h :  ${formatNumber(
      infoData.data.items[0].total_swaps_24h
    )} transactions
💸 Total Fees 24h :  $${formatNumber(infoData.data.items[0].total_fees_24h)}
✅ Last synced block :  ${healthData.data.items[0].synced_block_height}`;
    bot.sendMessage(chatId, response_template, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});
//Get liquidity
bot.onText(/^💰 Liquidity$/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const dex = dexList[users[chatId].current_dex]
    const response_data = await covalent.getInfo(dex.chainID,dex.dexName);
    const message = await getLiquidityMessage(0,response_data.data);
    if(message) {
        bot.sendMessage(
            chatId,
            message,
            getPaginationMessageOption("liquidity", 0, Math.round(response_data.data.items[0].liquidity_chart_30d.length/5) - 1, users[chatId].current_dex)
        );
    } else {
        errorHandler(bot,msg.chat.id);
    }
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});




//Get Volume
bot.onText(/^📈 Volume$/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const dex = dexList[users[chatId].current_dex]
    const response_data = await covalent.getInfo(dex.chainID,dex.dexName);
    const message = await getVolumeMessage(0,response_data.data);
    if(message) {
        bot.sendMessage(
            chatId,
            message,
            getPaginationMessageOption("volume", 0, Math.round(response_data.data.items[0].volume_chart_30d.length/5) - 1, users[chatId].current_dex)
        );
    } else {
        errorHandler(bot,msg.chat.id);
    }
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});
//Get Pools Data
bot.onText(/^🏦 Pools Data$/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const dex = dexList[users[chatId].current_dex]
    const response_data = await covalent.getPools(dex.chainID,dex.dexName,1,0);
    const message = await getPoolsMessage(response_data.data.items[0],dex.dexName);
    if(message) {
        bot.sendMessage(
            chatId,
            message,
            getPaginationMessageOption("pools", 0,Math.round(response_data.data.pagination.total_count/1) - 1 , users[chatId].current_dex)
        );
    } else {
        errorHandler(bot,msg.chat.id);
    }
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});
//Get Tokens Data
bot.onText(/^🪙 Tokens Data$/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const dex = dexList[users[chatId].current_dex]
    const response_data = await covalent.getTokens(dex.chainID,dex.dexName,1,0);
    const message = await getTokensMessage(response_data.data.items[0],dex.dexName);
    if(message) {
        bot.sendMessage(
            chatId,
            message,
            getPaginationMessageOption("tokens", 0,Math.round(response_data.data.pagination.total_count/1) - 1 , users[chatId].current_dex)
        );
    } else {
        errorHandler(bot,msg.chat.id);
    }
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});
//Get token
bot.onText(/^\/([a-zA-Z0-9])$/, (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const token = match[1];

    //get dex Tokens Data then send here
    bot.sendMessage(chatId, " Tokens Data " + token);
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});
//Get pool
bot.onText(/^\/([a-zA-Z0-9])_([a-zA-Z0-9])$/, (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const token1 = match[1];
    const token2 = match[2];

    //get dex Tokens Data then send here
    bot.sendMessage(chatId, " Pools Data " + token1 + "_" + token2);
  } catch (error) {
    console.log(error);
    errorHandler(bot,msg.chat.id);
  }
});

//Start bot
bot.onText(/\/start/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "✋ Welcome to MultiDEX, Choose your DEX", {
    reply_markup: dexMenu,
  });
});
//Cancel to Menu
bot.onText(/^⬅️ Back to Menu$/, (msg, match) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "✋ Welcome to MultiDEX, Choose your DEX", {
    reply_markup: dexMenu,
  });
});

// Listener (handler) for callback data from inline keyboard
bot.on('callback_query', async (callbackQuery) => {
    let data = JSON.parse(callbackQuery.data);
    let dex = dexList[data.dexName];
    let message = "";
    let response_data = {};
    switch (data.command) {
        case 'liquidity':
            response_data = await covalent.getInfo(dex.chainID,dex.dexName);
            message = await getLiquidityMessage(data.page,response_data.data);
            options = getPaginationMessageOption("liquidity", data.page, 5, data.dexName)
            bot.editMessageText(message, {
                chat_id: callbackQuery.message.chat.id,
                message_id: callbackQuery.message.message_id, 
                ...options
            });
            break;
        case 'volume':
            response_data = await covalent.getInfo(dex.chainID,dex.dexName);
            message = await getVolumeMessage(data.page,response_data.data);
            options = getPaginationMessageOption("volume", data.page, 5, data.dexName)
            bot.editMessageText(message, {
                chat_id: callbackQuery.message.chat.id,
                message_id: callbackQuery.message.message_id, 
                ...options
            });
            break;
        case 'pools':
            response_data = await covalent.getPools(dex.chainID,dex.dexName,1,data.page);
            message = await getPoolsMessage(response_data.data.items[0],dex.dexName);
            options = getPaginationMessageOption("pools", data.page,Math.round(response_data.data.pagination.total_count/1) - 1 , data.dexName);
            bot.editMessageText(message, {
              chat_id: callbackQuery.message.chat.id,
              message_id: callbackQuery.message.message_id, 
              ...options
            });
            break;
        case 'tokens':
            response_data = await covalent.getTokens(dex.chainID,dex.dexName,1,data.page);
            message = await getTokensMessage(response_data.data.items[0],dex.dexName);
            options = getPaginationMessageOption("tokens", data.page,Math.round(response_data.data.pagination.total_count/1) - 1 , data.dexName);
            bot.editMessageText(message, {
              chat_id: callbackQuery.message.chat.id,
              message_id: callbackQuery.message.message_id, 
              ...options
            });
            break;
        default:
            break;
    }
});