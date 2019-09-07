const test = require("ava");
const debug = require("debug")("chatopera:clause:test");
const Client = require("../index.js");

const CLAUSE_IP = "127.0.0.1";
const CLAUSE_PORT = 8056;
const chatbotID = "avtr001";
const intentName = "orderTakeOut";

function seconds(x) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, x * 1000);
  });
}

/**
 * 假设做一个订外卖对话机器人
 * 这个示例的说明文档的链接： https://github.com/chatopera/clause/wiki/%E7%A4%BA%E4%BE%8B%E7%A8%8B%E5%BA%8F
 */

test("Test Clause#chatbot", async t => {
  const client = new Client();
  var result = null;

  // 建立连接
  await client.connect(CLAUSE_IP, CLAUSE_PORT);

  /**
   * 标注数据
   */

  // 创建自定义词典
  result = await client.postCustomDict({
    customdict: {
      name: "food",
      chatbotID: chatbotID
    }
  });

  debug("postCustomDict result: %j", result);

  // 在自定义词典中增加词条
  var result = await client.putDictWord({
    chatbotID: chatbotID,
    dictword: {
      word: "西红柿",
      synonyms: "狼桃;柿子;番茄"
    },
    customdict: {
      name: "food"
    }
  });

  debug("putDictWord result: %j", result);

  // 引用系统词典
  result = await client.refSysDict({
    sysdict: {
      name: "@LOC" // 位置
    },
    chatbotID: chatbotID
  });

  debug("refSysDict result: %j", result);

  result = await client.refSysDict({
    sysdict: {
      name: "@TIME" // 时间
    },
    chatbotID: chatbotID
  });

  debug("refSysDict result: %j", result);

  // 创建意图
  result = await client.postIntent({
    intent: {
      chatbotID: chatbotID,
      name: "orderTakeOut"
    }
  });

  debug("postIntent result: %j", result);

  // 创建意图槽位: 配菜
  result = await client.postSlot({
    intent: {
      chatbotID: chatbotID,
      name: intentName
    },
    slot: {
      name: "vegetable",
      requires: true,
      question: "您需要什么配菜"
    },
    customdict: {
      chatbotID: chatbotID,
      name: "food"
    }
  });

  debug("postSlot result: %j", result);

  // 创建意图槽位: 送达时间
  result = await client.postSlot({
    intent: {
      chatbotID: chatbotID,
      name: intentName
    },
    slot: {
      name: "date",
      requires: true,
      question: "您希望什么时候用餐"
    },
    sysdict: {
      name: "@TIME"
    }
  });

  debug("postSlot result: %j", result);

  // 创建意图槽位: 送达位置
  result = await client.postSlot({
    intent: {
      chatbotID: chatbotID,
      name: intentName
    },
    slot: {
      name: "location",
      requires: true,
      question: "外卖送到哪里"
    },
    sysdict: {
      name: "@LOC"
    }
  });

  debug("postSlot result: %j", result);

  // 添加意图说法
  result = await client.postUtter({
    intent: {
      chatbotID: chatbotID,
      name: intentName
    },
    utter: {
      utterance: "我想点外卖"
    }
  });

  debug("postUtter result: %j", result);

  result = await client.postUtter({
    intent: {
      chatbotID: chatbotID,
      name: intentName
    },
    utter: {
      utterance: "帮我来一份{vegetable}，送到{location}"
    }
  });

  debug("postUtter result: %j", result);

  /**
   * 训练机器人
   */
  result = await client.train({
    chatbotID: chatbotID
  });

  debug("train result: %j", result);

  // 训练是一个长时运行的任务，进行异步反馈

  while (true) {
    await seconds(2);

    result = await client.status({
      chatbotID: chatbotID
    });

    if (result.rc == 0) {
      // 训练完成
      break;
    }
  }

  /**
   * 与机器人对话
   */
  let session = await client.putSession({
    session: {
      chatbotID: chatbotID,
      uid: "nodejs", // 用户唯一的标识
      channel: "testclient", // 自定义，代表该用户渠道由字母组成。
      branch: "dev" // 测试分支，有连个选项：dev, 测试分支；pro，生产分支。
    }
  });

  debug("session result: %j", session);

  let response = await client.chat({
    session: {
      id: session.session.id
    },
    message: {
      textMessage: "我想点外卖，来一份番茄"
    }
  });

  debug("chat result: %j", response);
  // 结果
  /**
 * 
 * "session": {
    "intent_name": "orderTakeOut",
    "chatbotID": "avtr001",
    "uid": "nodejs",
    "channel": "testclient",
    "resolved": false,
    "id": "24EEFDC7308D05379AF8848300000000",
    "entities": [
      {
        "name": "vegetable",
        "val": "番茄",
        "requires": true,
        "dictname": "food"
      },
      {
        "name": "date",
        "val": "",
        "requires": true,
        "dictname": "@TIME"
      },
      {
        "name": "location",
        "val": "",
        "requires": true,
        "dictname": "@LOC"
      }
    ],
    "branch": "dev",
    "createdate": "2019-09-07 18:14:39",
    "updatedate": "2019-09-07 18:14:39"
  },
  "message": {
    "textMessage": "您希望什么时候用餐",
    "is_fallback": false,
    "is_proactive": true
  }
 */

  t.pass();
});
