# Covalent MultiDEX Chatbot - Telegram
A telegram chatbot helps to provide exchange, liquidity, swap and other granular and historical data for multi DEX like Sushiswap, Quickswap,...

- Easy to access
- Easy to share 
- ✨Magic ✨

## Features

- Get DEX info
- View Liquidity over the last 30 days.
- View Volume over the last 30 days.
- View Pools data
- View Tokens data

## Upcoming features
- Support chart image
- Get token info by syntax : ``` $[token symbol] ```
- Get pool info by syntax : ``` $[token symbol 1] - $[token symbol 1] ```
- More DEX coming...

## Tech


- [Covalent API](https://www.covalenthq.com/) - A unified API bringing visibility to billions of blockchain data points.
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api) - Node.js module to interact with the official Telegram Bot API.


## Installation


Put configs into `local.yml`
```sh
cp config.js.template config.js
```
Install the dependencies and devDependencies and start the server.

```sh
npm i
npm start
```


