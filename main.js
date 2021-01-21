var player;
var socket = io();
var time_update_interval;
let cnt = 0;
let chr = "";
let countit = 0;
let messageStr = "";
let isYoutube = true;
let silenzioso = false;
let canNotify = false;
let alreadyToggled = false;
//let nickName = promt('Nick?')

var notifica = new Audio("assets/juntos-607.mp3");
function notify() {
  if (silenzioso === false && !isFullscreen()) {
    notifica.currentTime = 0;
    notifica.play();
  }
}
function makeNotify(msg) {
  let title = "Nuovo messaggio!";
  let icon = "assets/1f618.png";
  let body = msg; // + ' da ' + nickName
  if (canNotify && !isFullscreen()) {
    var notification = new Notification(title, { body, icon });
  }
  fetch(
    "sendpush?title=" +
      encodeURIComponent(title) +
      "&body=" +
      encodeURIComponent(body) +
      "&icon=" +
      encodeURIComponent(icon) +
      "&url=" +
      encodeURIComponent("/")
  );
}
function isFullscreen() {
  return window.innerHeight === screen.height;
}
//let myID = prompt('Come ti chiami?')
window.addEventListener("load", startup, false);

function updateString(messageStr) {
  document.getElementById("mywrite").innerText = messageStr;
}
function startup() {
  socket.on("connection", (socket) => {
    console.log("Connected");
  });
  socket.on("chat", (msg) => {
    console.log("message: " + msg.data);
    handleSocketMsg(msg, false);
  });
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Il max è escluso e il min è incluso
  }
  // Get the reference to video
  const video = document.getElementById("video");
  document.addEventListener("keypress", (e) => {
    if (document.getElementById("mywrite").innerText.trim().length === 0) {
      document.getElementById("mywrite").style.display = "none";
    } else {
      document.getElementById("mywrite").style.display = "block";
    }

    if (e.key == "a") {
      if (messageStr.match(/^incolla/i)) {
        messageStr = "";
        updateString(messageStr);
        navigator.clipboard
          .readText()
          .then((clipText) => updateChat(clipText, true));
      } else if ((m = messageStr.match(/^\s*moneta\s*$/))) {
        let moneta = "È uscita ";
        if (getRandomInt(0, 2) == 0) {
          moneta += "testa";
        } else {
          moneta += "croce";
        }
        messageStr = "" + moneta;
        //updateString(messageStr)
        handleSocketMsg(messageStr, true);
        messageStr = "";
        updateString(messageStr);
      }
    }
  });
  document.addEventListener(
    "keydown",
    function (e) {
      // if (e.key.match(/(\w|\s)/)) {

      //}

      if (window.innerHeight !== screen.height) {
        if (e.key === "a") {
          toggleFullScreen(video);
        }
      } else {
        if (e.key === "Backspace" || e.key === "Delete") {
          messageStr = messageStr.slice(0, -1);
          updateString(messageStr);
        } else if (e.key === "Enter") {
          let el = document.getElementById("mywrite");
          let txt = messageStr;
          console.log(messageStr);

          messageStr = "";
          el.innerText = "";
          updateChat(txt, true);
        } else if (e.key.length < 2) {
          messageStr += e.key;
          updateString(messageStr);
        }
      }
    },
    false
  );
}
function stripHtml(html) {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function handleSocketMsg(txt, sendit) {
  let msgID = txt.sender;
  let tcolor = "red";
  if (msgID == socket.id) {
    tcolor = "white";
  } else {
    tcolor = "yellow";
  }
  let messageStr = txt.data;
  if (typeof messageStr === "string" && messageStr.match(/^\s*sync\s*$/i)) {
    updateChat("vai " + parseInt(player.getCurrentTime()), true);
    return;
  }

  if (sendit) {
    socket.emit("chatin", txt);
    return;
  }
  notify();
  let videoElement = document.querySelector("#videotest");
  if (messageStr.match(/^\s*pausa\s*$/i)) {
    if (isYoutube) player.pauseVideo();
    else videoElement.pause();
  } else if (messageStr.match(/^\s*silenzioso\s*$/i)) {
    silenzioso = !silenzioso;
  } else if (messageStr.match(/^\s*play\s*$/i)) {
    if (isYoutube) player.playVideo();
    else videoElement.play();
  } else if ((m = messageStr.match(/^\s*vai\s*a\s*(\d*):?(\d+)/i))) {
    let toseek = parseInt(m[1]) * 60 + parseInt(m[2]);

    if (isYoutube) player.seekTo(toseek);
    else videoElement.currentTime = toseek;
  } else if (messageStr.match(/^\s*voce\s*$/i)) {
    if (isYoutube) {
      if (player.isMuted()) {
        player.unMute();
      } else {
        player.mute();
      }
    } /*else {
      if (videoElement.muted) {
        player.muted = false
      } else {
        player.muted = true
      }
    }*/
  } else if ((m = messageStr.match(/\s*watch\?v=\s*([a-z0-9\-_]+)/i))) {
    //player.videoId = m[1]

    let url = m[1];
    if (isYoutube === false) {
      isYoutube = true;
      onYouTubeIframeAPIReady();
      setTimeout(() => {
        player.cueVideoById(url);
        player.nextVideo();
        player.playVideo();
      }, 1000);
    } else {
      player.cueVideoById(url);
      player.nextVideo();
      player.playVideo();
    }
    let dataInterval = setInterval(() => {
      if (parseInt(player.getCurrentTime()) > 0) {
        socket.emit("chatin", JSON.stringify(player.getVideoData()));
        clearInterval(dataInterval);
      }
    }, 500);
  } else if (messageStr.match(/^\s*online\s*$/i)) {
    socket.emit("chatin", socket.id);
  }

  cnt++;
  let counter = cnt;
  let el = document.createElement("div");
  el.id = "message" + counter;
  el.class = "message";
  //el.innerText = messageStr
  el.innerHTML =
    '<div style="margin:20px"><em class="nuvoletta" style="color:' +
    tcolor +
    '">' +
    stripHtml(messageStr)
      .replace(
        "<3",
        '<i class="em em-heart" aria-role="presentation" aria-label="HEAVY BLACK HEART"></i>'
      )
      .replace(
        ";*",
        '<i class="em kiss" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":*",
        '<i class="em kissing_heart" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":')",
        '<i class="em joy_cat" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":p",
        '<i class="em lingua" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        "*.*",
        '<i class="em occhiheart" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":love",
        '<i class="em occhiheart" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":)",
        '<i class="em sorrisino" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        "*-*",
        '<i class="em sorrisocuori" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      )
      .replace(
        ":P",
        '<i class="em lingua" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
      ) +
    "</em><div>";
  document.getElementById("chatcontent").prepend(el);
  //let elem = document.getElementById('message1')
  el.style.opacity = 1;
  el.style.transform = "scale(1)";

  let removeMessageLoop = window.setInterval(function () {
    if (isFullscreen()) {
      let hint = document.getElementById("message" + counter);

      hint.style.opacity = 0;
      hint.style.transform = "scale(0)";
      window.setTimeout(function () {
        hint.style.display = "none";
        hint.parentNode.removeChild(hint);
      }, 700);
    }
  }, 15000);
  makeNotify(messageStr);
}
function updateChat(txt, sendit) {
  let messageStr = txt;
  if (messageStr.match(/^\s*sync\s*$/i)) {
    if (isYoutube) {
      let nowt = player.getCurrentTime();
      updateChat(
        "vai a " + parseInt(nowt / 60) + ":" + parseInt(nowt % 60),
        true
      );
    } else {
      let videoElement = document.querySelector("#videotest");
      let nowt = videoElement.currentTime;
      updateChat(
        "vai a " + parseInt(nowt / 60) + ":" + parseInt(nowt % 60),
        true
      );
    }
    return;
  }

  if (sendit) {
    socket.emit("chatin", txt);
    return;
  }
  messageStr = txt.data;

  if (messageStr.match(/^\s*pausa\s*$/i)) {
    player.pauseVideo();
  } else if (messageStr.match(/^\s*play\s*$/i)) {
    player.playVideo();
  } else if ((m = messageStr.match(/^\s*vai\s*a\s*(\d+):(\d+)/i))) {
    let toseek = parseInt(m[1]) * 60 + parseInt(m[2]);
    player.seekTo(toseek);
  } else if (messageStr.match(/^\s*voce\s*$/i)) {
    if (player.isMuted()) {
      player.unMute();
    } else {
      player.mute();
    }
  } else if ((m = messageStr.match(/^\s*video\s*([a-z0-9\-_]+)/i))) {
    //player.videoId = m[1]
    let url = "F1Knx7hdguI";
    player.cueVideoById(url);
    player.nextVideo();
    player.playVideo();
  }
  fetch("json.json?")
    .then((j) => j.json())
    .then(function (j) {
      cnt++;
      let counter = cnt;
      let el = document.createElement("div");
      el.id = "message" + counter;
      el.class = "message";
      el.innerText = j.data + txt;
      el.innerHTML =
        '<em style="color:' +
        tcolor +
        ">" +
        el.innerText
          .replace(
            "<3",
            '<i class="em em-heart" aria-role="presentation" aria-label="HEAVY BLACK HEART"></i>'
          )
          .replace(
            ";*",
            '<i class="em kiss" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
          )
          .replace(
            ":*",
            '<i class="em kissing_heart" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
          )
          .replace(
            ":')",
            '<i class="em joy_cat" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
          )
          .replace(
            ":p",
            '<i class="em lingua" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
          )
          .replace(
            ":P",
            '<i class="em lingua" aria-role="presentation" aria-label="FACE THROWING A KISS"></i>'
          ) +
        "</em>";
      document.getElementById("chatcontent").prepend(el);
      //let elem = document.getElementById('message1')
      el.style.opacity = 1;
      el.style.transform = "scale(1)";

      setTimeout(() => {
        let hint = document.getElementById("message" + counter);

        hint.style.opacity = 0;
        hint.style.transform = "scale(0)";
        window.setTimeout(function () {
          hint.style.display = "none";
          hint.parentNode.removeChild(hint);
        }, 700);
        //
      }, 30000);
    });
}

function toggleFullScreen(video) {
  document.querySelector("#video").style.display = "block";
  if (document.fullscreenElement === null) {
    //alert('full')
    // If the document is not in full screen mode
    // make the video full screen
    video.requestFullscreen();
    video.onfullscreenchange = function () {
      if (document.fullscreenElement === null) {
        return;
      }
      let videoElement = document.querySelector("#videotest");
      videoElement.style.width = "100%";
      videoElement.style.height = "100%";
      document.querySelector("#chat").style.cursor = "none";
      document.onmousemove = () => {
        document.querySelector("#chat").style.cursor = "auto";
        setTimeout(() => {
          document.querySelector("#chat").style.cursor = "none";
        }, 2000);
      };
      //videoElement.style.position = 'relative'

      if (!alreadyToggled) {
        if (isYoutube) player.playVideo();
        else videoElement.play();
        alreadyToggled = true;
      }

      setTimeout(() => {
        document.querySelector("#videotest").position = "relative";
        let el = document.createElement("div");
        el.style.display = "inline-block";
        el.style.position = "absolute";
        el.style.marginTop = "100px";
        el.style.width = "100%";
        el.style.minHeight = "100px";
        el.style.opacity = 0.7;
        el.style.textAlign = "center";
        el.style.background = "red";
        el.textContent = "helloooo";
        el.class = "bar";
        document.querySelector("#videotest").appendChild(el);
      }, 1000);

      /*
      setInterval(() => {
        updateChat()
      }, 1000)*/
    };
  } else {
    // Otherwise exit the full screen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}
function initialize() {
  // Update the controls on load
  updateTimerDisplay();
  updateProgressBar();

  // Clear any old interval.
  clearInterval(time_update_interval);

  // Start interval to update elapsed time display and
  // the elapsed part of the progress bar every second.
  time_update_interval = setInterval(function () {
    updateTimerDisplay();
    updateProgressBar();
  }, 1000);

  Notification.requestPermission().then(function (permission) {
    canNotify = true;
  });
}

function onYouTubeIframeAPIReady() {
  let thisurl = window.location.href.match(/url=([^&]+)/);
  if (thisurl) {
    let p = thisurl[1].match(/v=([^&]+)/i);
    if (p) {
      let yvideoId = p[1];
      //setTimeout(() => {
      socket.emit("chatin", "https://www.youtube.com/watch?v=" + yvideoId);
      //}, 5000)

      player = new YT.Player("videotest", {
        width: 600,
        height: 400,
        videoId: yvideoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          color: "white",
          cc_lang_pref: "en",
          cc_load_policy: 1,
        },
        events: {
          onReady: initialize,
        },
      });
      player.loadModule("captions");
    }
  }
  if (!isYoutube) return;
  fetch("lastvideo")
    .then((v) => v.json())
    .then((resp) => {
      let yvideoId = resp.lastvideo;
      console.log(yvideoId);
      player = new YT.Player("videotest", {
        width: 600,
        height: 400,
        videoId: yvideoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          color: "white",
          cc_lang_pref: "en",
          cc_load_policy: 0,
        },
        events: {
          onReady: initialize,
        },
      });
      player.loadModule("captions");
    });
}

// This function is called by initialize()
function updateTimerDisplay() {
  // Update current time text display.
  //$('#current-time').text(formatTime(player.getCurrentTime()))
  //$('#duration').text(formatTime(player.getDuration()))
}

function formatTime(time) {
  time = Math.round(time);

  var minutes = Math.floor(time / 60),
    seconds = time - minutes * 60;

  seconds = seconds < 10 ? "0" + seconds : seconds;

  return minutes + ":" + seconds;
}

function updateProgressBar() {
  // Update the value of our progress bar accordingly.
  //$('#progress-bar').val((player.getCurrentTime() / player.getDuration()) * 100);
}
//window.onbeforeunload = () => {
// socket.emit('chatin', 'Disconnected: ' + socket.id)
//}
