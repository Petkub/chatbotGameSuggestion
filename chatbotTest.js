const functions = require("firebase-functions");
const {WebhookClient , Payload} = require("dialogflow-fulfillment");

const region = "asia-southeast1";
const runtimeOptions = {
  timeoutSeconds: 4,
  memory: "2GB"
};

const firebase = require("firebase-admin");
firebase.initializeApp({
  credential: firebase.credential.applicationDefault(),
  databaseURL: "https://gamesuggestionproject.firebaseio.com"
});
var db = firebase.firestore();

exports.webhook2 = functions
.region(region)
.runWith(runtimeOptions)
.https.onRequest((req, res) => {
    
const agent = new WebhookClient({ request: req, response: res });

const gameSuggestions = async agent =>{
  
  return db
    .collection("gameList")
    .get()
    .then(snapshot => {
      var gameData = []; // สร้าง Array ชื่อ gameData เพื่อเก็บข้อมูล
      snapshot.docs.forEach(doc => {
        gameData.push(doc.data()); // เก็บข้อมูลจาก snapshot ลงใน gameData
      })
      let flexMsg ={
        "line": {
          "type": "flex",
          "altText": "เลือกเกมได้เลย",
          "contents": {
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": gameData[0].image, // แสดงรูปภาพจาก gameData[0].image
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover",

            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "spacing": "md",
              "contents": [
                {
                  "type": "text",
                  "text": gameData[0].game,
                  "weight": "bold", // แสดงข้อความจาก gameData[0].name
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
                          "text": gameData[0].price + " บาท", // แสดงข้อความจาก gameData[0].price
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
                  "text": "Release Date: " + gameData[0].releaseDate, // แสดงข้อความจาก gameData[0].releaseDate
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
                    "uri": gameData[0].link // แสดงข้อความจาก gameData[0].link
                  },
                  "color": "#905C44",
                  "style": "primary"
                }
              ]
            }
          }
        }
      };
      const PayloadFlexMsg = new Payload("LINE", flexMsg, {rawPayload: true, sendAsMessage: true});
      agent.add(PayloadFlexMsg);
    })

};
let intentMap = new Map();
intentMap.set("game-suggestion", gameSuggestions);
agent.handleRequest(intentMap);
});