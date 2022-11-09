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
      var randGame = Array.from(myRandomInt(3, 10));
      var gameList = ['Adventure', 'Arcade', 'FPS', 'Horor', 'MMO', 'MOBA', 'Puzzle', 'Racing', 'Sport', 'Survival'];
      var price = ['ถูกๆ', 200, 400, 600, 800, 1000];
      var randPrice = Array.from(myRandomInt(3, 5));
      let flexMsg = {
        "line": {
          "type": "flex",
          "altText": "Flex Message",
          "contents": {
            "type": "bubble",
            "direction": "ltr",
            "hero": {
              "type": "image",
              "url": "https://wallpapers.com/images/high/minecraft-meme-steve-and-creeper-ymxwe6ty97hvobk0-ymxwe6ty97hvobk0.webp",
              "size": "full",
              "aspectRatio": "1.51:1",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "เกมแนวไหนดี?",
                  "weight": "bold",
                  "align": "center",
                  "contents": []
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "horizontal",
              "contents": [
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "button",
                      "action": {
                        "type": "message",
                        "label": gameList[randGame[0]] + " " + price[randPrice[0]],
                        "text": gameList[randGame[0]] + " " + price[randPrice[0]]
                      },
                      "color": "#55EA3456",
                      "style": "secondary",
                      "offsetEnd": "xs"
                    },
                    {
                      "type": "button",
                      "action": {
                        "type": "message",
                        "label": gameList[randGame[1]] + " " + price[randPrice[1]],
                        "text": gameList[randGame[1]] + " " + price[randPrice[1]]
                      },
                      "color": "#55EA3456",
                      "style": "secondary",
                      "offsetTop": "sm",
                      "offsetEnd": "xs"
                    }
                  ]
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "contents": [
                    {
                      "type": "button",
                      "action": {
                        "type": "message",
                        "label": gameList[randGame[2]] + " " + price[randPrice[2]],
                        "text": gameList[randGame[2]] + " " + price[randPrice[2]]
                      },
                      "color": "#55EA3456",
                      "style": "secondary",
                      "offsetStart": "xs"
                    },
                    {
                      "type": "button",
                      "action": {
                        "type": "message",
                        "label": "อะไรก็ได้",
                        "text": "อะไรก็ได้"
                      },
                      "color": "#FFFFFFFF",
                      "style": "secondary",
                      "offsetTop": "sm",
                      "offsetStart": "xs"
                    }
                  ]
                }
              ]
            }
          }
        }
          }
            const payload = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true });
            agent.add(payload);
    };

    const gameSuggestionCategory = async agent => {
      const text = req.body.queryResult.queryText;
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
      
      if(fixPrice != "")
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
        let bubbleFlex = 4;

        if(data_pack.length < bubbleFlex)
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
                  "gravity": "center",
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
                          "size": "xl"
                        },
                        {
                          "type": "text",
                          "text": `${data_pack[rand[i]].price} บาท`,
                          "weight": "bold",
                          "size": "xxl",
                          "margin": "sm",
                          "contents": []
                        }
                      ]
                    }
                  ]
                },
                {
                  "type": "text",
                  "text": "Release Date:" + data_pack[rand[i]].releaseDate,
                  "size": "xs",
                  "color": "#000000FF",
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
                  "type": "button",
                  "action": {
                    "type": "uri",
                    "label": "Website",
                    "uri": data_pack[rand[i]].link
                  },
                  "color": "#905C44",
                  "style": "primary"
                }
              ]
            }
          }
          flexMsg.line.contents.contents.push(gameData);
        }
          let dataEnd = {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": "https://wallpapercave.com/wp/wp8422268.jpg",
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
                  "text": "ต้องการเกมเพิ่มไหม?",
                  "weight": "bold",
                  "size": "xl",
                  "align": "center",
                  "gravity": "center",
                  "contents": []
                }
              ]
            },
            "footer": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "More",
                    "text": text
                  },
                  "color": "#5BDF9EFF",
                  "style": "primary"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "message",
                    "label": "พอแล้ว",
                    "text": "พอแล้ว"
                  },
                  "color": "#FFFFFFFF",
                  "style": "secondary"
                }
              ]
            }
          }
          flexMsg.line.contents.contents.push(dataEnd);
        if(bubbleFlex > 0)
        {
          const payloadMsg = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true})
          agent.add(payloadMsg);
        }
        else
        {
          agent.add("ไม่พบข้อมูล");
        }
      });
    };

    const gameSuggestionNo = async agent => {
      var setRandom = myRandomInt(3, 10);
      var rand = Array.from(setRandom);
      var gameList = ['Adventure', 'Arcade', 'FPS', 'Horor', 'MMO', 'MOBA', 'Puzzle', 'Racing', 'Sport', 'Survival'];
      let msgQuickReply = {
        "line": {
          "type": "text",
          "text": "ไว้เจอกันใหม่ ลาก่อน",
          "quickReply": {
            "items": [
              {
                "type": "action",
                  "action": {
                  "type": "message",
                  "label": "อยากเล่นเกม",
                  "text": "อยากเล่นเกม"
                },
              },
            ]
          }
        }
      }
      for (let i = 0; i < 3; i++) 
      {
        let itemData =
          {
            "type": "action",
              "action": {
              "type": "message",
              "label": gameList[rand[i]],
              "text": gameList[rand[i]]
            }
          }
        msgQuickReply.line.quickReply.items.push(itemData);
      }
      const payloadMsg = new Payload("LINE", msgQuickReply, {rawPayload: true, sendAsMessage: true});
      agent.add(payloadMsg);
      //agent.add("ไว้เจอกันใหม่ ลาก่อน");
    };

    let intentMap = new Map();
    intentMap.set("game-suggestion", gameSuggestion);
    intentMap.set("game-suggestion-category", gameSuggestionCategory);
    intentMap.set("game-suggestion-category-no", gameSuggestionNo);
    agent.handleRequest(intentMap);
  });