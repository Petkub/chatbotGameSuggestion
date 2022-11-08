const functions = require("firebase-functions");
const request = require("request-promise");
const config = require("./config.json");
const seedRandom = require("seedrandom");

const { WebhookClient, Payload} = require("dialogflow-fulfillment");

const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: config.databaseURL
});

var db = firebase.firestore();
const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 10,
  memory: "2GB"
};

function myRandomInt(quantity, max) 
{
  const set = new Set();
  while(set.size < quantity) 
  {
    let seedRand = seedRandom();
    set.add(Math.floor(seedRand('added entropy.', {entropy: true}) * max));
  }
  return set
};

exports.webhook = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (req, res) => {

    const agent = new WebhookClient({ request: req, response: res });

    const gameSuggestion = async agent => {
          agent.add("Here are some games you might like!");
    };

    const gameSuggestionCategory = async agent => {
      let flexMsg = {
        "line": {
          "type": "flex",
          "altText": "Flex Message",
          "contents": {
            "type": "carousel",
            "contents": [
            ]
          }
        }
      };

      var category = req.body.queryResult.parameters.category;
      var gameRef = db.collection('gameList'); //gameList
      if(category != "Any")
      {
        gameRef = gameRef.where("gameType", "==", category);
      }
      var price = req.body.queryResult.parameters.number;
      var fixPrice= req.body.queryResult.parameters.price;
      var condition = req.body.queryResult.parameters.condition;
      
      if(fixPrice != null && price.length == 0)
      {
        if(fixPrice == "Free")
          var priceRef = gameRef.where("price", "==", 0);
        else if(fixPrice == "Cheap")
          var priceRef = gameRef.where("price", "<=", 500);
        else if(fixPrice == "Expensive")
          var priceRef = gameRef.where("price", ">=", 1000);
      }
      else if (price.length == 2)
      {
        if(condition[0] == "less" && condition[1] == "greater")
        {
          var priceRef = gameRef.where("price", ">=", price[1]).where("price", "<=", price[0]);
        }
        else if(condition[0] == "greater" && condition[1] == "less")
        {
          var priceRef = gameRef.where("price", ">=", price[0]).where("price", "<=", price[1]);
        }
        else
          var priceRef = gameRef.where("price", ">=", price[0]).where("price", "<=", price[1]);
      }
      else if(price.length == 1)
      {
        if(condition[0] == "greater")
        {
          var priceRef = gameRef.where("price", ">=", price[0]);
        }
        else if(condition[0] == "less")
        {
          var priceRef = gameRef.where("price", "<=", price[0]);
        }
        else
          var priceRef = gameRef.where("price", ">=", price[0]-50).where("price", "<=", price[0]+100);
      }
      else
          var priceRef = gameRef.where("price", ">=", 0);

      return priceRef
      .get()
      .then((pack) => {
        let data_pack = [];
        pack.docs.forEach(doc => {
          data_pack.push(doc.data());
        });
        let rand = [];
        let bubbleFlex = 3;

        if(data_pack.length < 3)
        {
          bubbleFlex = data_pack.length;
        }

        let setRandom = myRandomInt(bubbleFlex, data_pack.length);
        rand = Array.from(setRandom);

        for(let i = 0;i < bubbleFlex;i++)
        {
          let gameData =
          {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": data_pack[rand[i]].image,
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                {
                  "type": "text",
                  "text": data_pack[rand[i]].game,
                  "weight": "bold",
                  "size": "xl",
                  "contents": []
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "baseline",
                      "contents": [
                        {
                          "type": "icon",
                          "url": "https://mario.wiki.gallery/images/thumb/1/17/CoinMK8.png/1200px-CoinMK8.png",
                          "size": "xxl"
                        },
                        {
                          "type": "text",
                          "text": `${data_pack[rand[i]].price} บาท`,
                          "weight": "bold",
                          "size": "xxl",
                          "margin": "lg",
                          "offsetBottom": "sm",
                          "contents": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "text",
                  "text": "Release date: " + data_pack[rand[i]].releaseDate,
                  "weight": "regular",
                  "size": "md",
                  "color": "#574E4EFF",
                  "wrap": true,
                  "contents": []
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "spacer",
                  "size": "xs"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "Website",
                    "uri": data_pack[rand[i]].link
                  },
                  "color": "#1B8DC5FF",
                  "style": "primary"
                }
              ]
            }
          }
          flexMsg.line.contents.contents.push(gameData);
        }
        if(bubbleFlex > 0)
        {
          const payloadFlexMsg = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true });
          agent.add(payloadFlexMsg);
        }
        else
          agent.add("ไม่พบข้อมูล");
      });

  };
    let intentMap = new Map();
    intentMap.set("game-suggestion", gameSuggestion);
    intentMap.set("game-suggestion-category", gameSuggestionCategory);
    agent.handleRequest(intentMap);
  });