/**
 * Intent Service Client
 */
const debug = require("debug")("chatopera:clause");
const thrift = require("thrift");
const Serving = require("./lib/gen-nodejs/Serving");
const ttypes = require("./lib/gen-nodejs/server_types");
const Q = require("q");

const METHODS = [
  // 自定义字典
  "postCustomDict",
  "putCustomDict",
  "getCustomDicts",
  "getCustomDict",
  "delCustomDict",
  // 系统字典管理
  //   "postSysDict", // 不开放到Superbrain
  //   "putSysDict",  // 不开放到Superbrain
  "getSysDicts",
  "getSysDict",
  "refSysDict",
  "unrefSysDict",
  // 词条管理
  "putDictWord",
  "getDictWords",
  "delDictWord",
  "hasDictWord",
  // 获得所有自定义词典列表和被引用的系统列表
  "myDicts",
  // 获得被引用的系统词典列表
  "mySysdicts",
  // 意图管理
  "postIntent",
  "putIntent",
  "getIntents",
  "getIntent",
  "delIntent",
  // 意图说法管理
  "postUtter",
  "putUtter",
  "getUtters",
  "getUtter",
  "delUtter",
  // 意图槽位管理
  "postSlot",
  "putSlot",
  "getSlots",
  "getSlot",
  "delSlot",
  // 对话管理
  "train",
  "status",
  "chat",
  "version",
  "prover",
  "devver",
  "online",
  "offline",
  "putSession",
  "getSession"
];

function Client() {
  this._client = null;
  this.resolved = false;
}

Client.prototype.connect = function(ip, port) {
  let deferred = Q.defer();

  var _conn = thrift.createConnection(ip, port, {
    transport: thrift.TFramedTransport,
    protocol: thrift.TBinaryProtocol,
    max_attempts: 1000,
    retry_max_delay: 2000,
    connect_timeout: 600000
  });

  this._client = thrift.createClient(Serving, _conn);

  _conn.on("error", err => {
    console.error("clause: Thrift Connection error", err);
    if (!this.resolved) {
      deferred.reject(err);
    }
  });

  _conn.on("connect", () => {
    debug("thrift clause connection is established successfully.");
    this.resolved = true;
    deferred.resolve();
  });

  for (let x of METHODS) {
    Client.prototype[x] = Q.nbind(this._client[x], this._client);
  }

  return deferred.promise;
};

exports = module.exports = Client;
