var app = require("express")();
var express = require("express");
var helmet = require("helmet");
var http = require("http").createServer(app);
var io = require("socket.io")(http);
const fs = require("fs");
const https = require("https");

let lastvideo = fs.readFileSync("./lastvideo.txt", {
  encoding: "utf8",
  flag: "r",
});
// const fcm = require("./sendMessageTopicFCM");
// const videovisti = require("../youtubeApi/parseLog");

/*doc.body.innerText.split('\n').reduce((acc, val) => {
  val = val.trim()
  if (val.length > 0) {
    if (val in acc) {
      acc[val] = 1
    } else {
      acc[val]++
    }
  }
  return acc
}, Object.create(null))*/

// let topicFCM = "topic";
// console.log(fcm.sendMsg);

//setting middleware

var bodyParser = require("body-parser");
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
/*
app.disable('x-powered-by')
app.disable('last-modified')
app.disable('etag')
app.set('etag', false) // turn off
app.set('last-modified', false)
app.use(helmet())
var options = {
  dotfiles: 'ignore',
  etag: false,
  index: false,
  lastModified: false,
  setHeaders: function (res, path, stat) {
    res.set('last-modified', Date.now())
  },
}
app.get('/*', function (req, res, next) {
  res.setHeader('Last-Modified', new Date().toUTCString())
  //res.removeHeader('Last-Modified')
  //res.removeHeader('ETag')
  res.setHeader('ETag', new Date().getTime())

  next()
})*/
app.use(express.static(__dirname)); //Serves resources from public folder

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
app.get("/sendpush", (req, res) => {
  if (
    req.query.title !== undefined &&
    req.query.body !== undefined &&
    req.query.icon !== undefined &&
    req.query.url !== undefined
  ) {
    res.json({ ok: true });
    // fcm.sendMsg(
    //   req.query.title,
    //   req.query.body,
    //   req.query.icon,
    //   req.query.url,
    //   topicFCM
    // );
  } else {
    res.json({ error: true });
  }
});
app.get("/lastvideo", (req, res) => {
  lastvideo = fs.readFileSync("./lastvideo.txt", {
    encoding: "utf8",
    flag: "r",
  });
  res.json({ lastvideo });
});

app.get("/videovisti", (req, res) => {
  //res.send(videovisti.getList());
  //res.send('Hello World!')
});

app.post("/pushnotifications", (req, res) => {
  res.json({ ok: true });
  console.log(req.body);
});
app.get("/fcm-api", (req, res) => {
  if (req.query.apiKey !== "undefined") {
    let apiK = req.query.apiKey.trim();
    console.log(apiK);
    subscribeTopic(apiK, res);
  }
});

io.on("connection", (socket) => {
  /*socket.on('disconnect', function () {
    io.emit('chat', {
      data: 'DISCONNECTED id ' + socket.id,
      sender: socket.id,
    })
  })*/
  socket.on("disconnect", function () {
    console.log("user disconnected");
    io.emit("chat", {
      data: "DISCONNECTED id " + socket.id,
      sender: socket.id,
    });
  });
  console.log("a user connected " + socket.id);
  io.emit("chat", { data: "new user with id " + socket.id, sender: socket.id });
  socket.on("chatin", (msg) => {
    console.log("message: " + msg);
    let mex = { data: msg, sender: socket.id };
    let m;
    if (msg !== null && (m = msg.match(/\s*watch\?v=\s*([a-z0-9\-_]+)/i))) {
      lastvideo = m[1];
      fs.writeFileSync("lastvideo.txt", lastvideo, {
        encoding: "utf8",
        flag: "w+",
        mode: 0o666,
      });
    }
    io.emit("chat", mex);
    fs.writeFileSync(
      "../chat.txt",
      "" + new Date() + " \tFrom " + socket.id + " \t" + msg + "\n",
      {
        encoding: "utf8",
        flag: "a+",
        mode: 0o666,
      }
    );
    //socket.emit(msg)
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});

function subscribeTopic(apiKey, rexx) {
  const data = JSON.stringify({
    todo: "Buy the milk",
  });

  const options = {
    hostname: "iid.googleapis.com",
    port: 443,
    path: "/iid/v1/" + apiKey + "/rel/topics/" + topicFCM,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "key=AA...p93",
    },
  };

  const req = https.request(options, (res) => {
    if (res.statusCode == 200) {
      rexx.json({ ok: true });
    } else {
      rexx.json({ error: true });
    }
    console.log(`statusCode: ${res.statusCode}`);

    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });

  req.on("error", (error) => {
    console.error(error);
  });

  req.write(data);
  req.end();
}
