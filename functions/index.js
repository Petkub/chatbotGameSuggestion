const functions = require("firebase-functions");
const request = require("request-promise");
const config = require("./config.json");

const { WebhookClient, Payload} = require("dialogflow-fulfillment");

const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: config.databaseURL
});

var db = firebase.firestore();
const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

function myRandomInt(quantity, max) 
{
  const set = new Set();
  while(set.size < quantity) 
  {
    set.add(Math.floor(Math.random() * max));
  }
  return set
};

exports.webhook = functions
  .region(region)
  .runWith(runtimeOptions)
  .https.onRequest(async (req, res) => {

    const agent = new WebhookClient({ request: req, response: res });

    const gameSuggestion = async agent => {
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
      // const payloadFlexMsg = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true });
      // return agent.add(payloadFlexMsg);

      return db
      .collection("Horor")
      .get()
      .then((pack) => {
        let data_pack = [];
        pack.docs.forEach(doc => {
          data_pack.push(doc.data());
        });

        for(let i = 0;i < 3;i++)
        {
          setRandom = myRandomInt(3, data_pack.length);
          const rand = Array.from(setRandom);
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
                          "text": data_pack[rand[i]].price,
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
        const payloadFlexMsg = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true });
        agent.add(payloadFlexMsg);
      });

  };
    let intentMap = new Map();
    intentMap.set("game-suggestion", gameSuggestion);
    agent.handleRequest(intentMap);
  });

