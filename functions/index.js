const functions = require("firebase-functions");
// const request = require("request-promise");
// const config = require("./config.json");
const { WebhookClient } = require("dialogflow-fulfillment");

const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

exports.webhook = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (req, res) => 
  {
    const agent = new WebhookClient({ request: req, response: res });

    const game_suggestion = async agent => 
    {
      agent.add("Fulifillments Game Suggestions");
    };
    
    let intentMap = new Map();
    intentMap.set("game-suggestion", game_suggestion);
    agent.handleRequest(intentMap);
  });