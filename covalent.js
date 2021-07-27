const axios = require('axios').default;
const config = require("./config");

async function getData(url){
    try {
        console.log(url);
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports.getHealth = async function getHealth(chainID,dexName){
    const url = `${config.covalentURL}/v1/${chainID}/xy=k/${dexName}/health/?key=${config.covalentAPIKey}`;
    return await getData(url);

};
module.exports.getInfo = async function (chainID,dexName){
    const url = `${config.covalentURL}/v1/${chainID}/xy=k/${dexName}/ecosystem/?key=${config.covalentAPIKey}`;
    return await getData(url);
};
module.exports.getPools = async function (chainID,dexName,pageSize = 100,pageNumber = 0){
    const url = `${config.covalentURL}/v1/${chainID}/xy=k/${dexName}/pools/?key=${config.covalentAPIKey}&page-size=${pageSize}&page-number=${pageNumber}`;
    return await getData(url);
};
module.exports.getPoolData = async function (chainID,dexName,address){
};
module.exports.getPoolTransactions = async function (chainID,dexName,address){
};
module.exports.getTokens = async function (chainID,dexName,pageSize = 100,pageNumber = 0){
    const url = `${config.covalentURL}/v1/${chainID}/xy=k/${dexName}/tokens/?key=${config.covalentAPIKey}&page-size=${pageSize}&page-number=${pageNumber}`;
    return await getData(url);
};
module.exports.getTokenData = async function (chainID,dexName,address){
};
module.exports.getTokenTransactions = async function (chainID,dexName,address){
};

