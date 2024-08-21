const urlParams = new URLSearchParams(window.location.search);
let currentChannel = urlParams.get("channel") || "ScienceAndTech";
let channelNameDisplay = document.getElementById("channel-name-display");
let videoIdDisplay = document.getElementById("video-id-display");
let player;
let mouseTimer;
const overlay = document.getElementById("overlay");
const muteToggle = document.getElementById("mute-toggle");
const channelPrev = document.getElementById("channel-prev");
const channelNext = document.getElementById("channel-next");
const infoButton = document.getElementById("info-button");
const channelNames = Object.keys(channels);

function updateTxt(videoId) {
  channelNameDisplay.textContent =
    "Ch" +
    parseInt(channelNames.indexOf(currentChannel) + 1) +
    ":" +
    currentChannel;
  videoIdDisplay.textContent = videoId;
}

function onYouTubeIframeAPIReady() {
  loadPlayer();
}

function loadPlayer() {
  const { videoId, startTime } = getCurrentVideo();
  updateTxt(videoId);
  player = new YT.Player("player", {
    height: "120%",
    width: "100%",
    videoId: videoId,
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      rel: 0,
      showinfo: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      start: startTime,
      mute: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
  });
}

function onPlayerReady(event) {
  event.target.playVideo();

  setInterval(syncVideo, 60000);

  muteToggle.addEventListener("click", toggleMute);

  channelPrev.addEventListener("click", () => switchChannel(-1));
  channelNext.addEventListener("click", () => switchChannel(1));

  infoButton.addEventListener("click", showInfo);

  document.addEventListener("keydown", function (event) {
    if (event.key == "ArrowLeft") {
      switchChannel(-1);
    } else if (event.key == "ArrowUp") {
      switchChannel(1);
    } else if (event.key == "ArrowRight") {
      switchChannel(1);
    } else if (event.key == "ArrowDown") {
      switchChannel(-1);
    } else if (event.key == "m") {
      toggleMute();
    }
  });
}

function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.ENDED) {
    syncVideo();
  } else if (event.data == YT.PlayerState.PAUSED) {
    // If it's paused, try to resume playback
    player.playVideo();
  }
  setTimeout(() => {
    document.getElementById("static-image").style.display = "none";
  }, 1000);
}

function getCurrentVideo() {
  const now = moment();
  const secondsInDay = now.hours() * 3600 + now.minutes() * 60 + now.seconds();
  const totalDuration = channels[currentChannel].reduce(
    (acc, video) => acc + video.duration,
    0,
  );
  let currentSecond = secondsInDay % totalDuration;

  let currentVideoIndex = 0;
  let currentVideoDuration =
    channels[currentChannel][currentVideoIndex].duration;

  while (currentSecond >= currentVideoDuration) {
    currentSecond -= currentVideoDuration;
    currentVideoIndex++;
    if (currentVideoIndex >= channels[currentChannel].length) {
      currentVideoIndex = 0;
    }
    currentVideoDuration = channels[currentChannel][currentVideoIndex].duration;
  }

  return {
    videoId: channels[currentChannel][currentVideoIndex].id,
    startTime: Math.floor(currentSecond),
  };
}

function syncVideo() {
  const { videoId, startTime } = getCurrentVideo();
  updateTxt(videoId);
  if (player.getVideoData().video_id !== videoId) {
    player.loadVideoById({
      videoId: videoId,
      startSeconds: startTime,
    });
  } else {
    const playerTime = player.getCurrentTime();
    if (Math.abs(playerTime - startTime) > 2) {
      player.seekTo(startTime, true);
    }
  }
  player.playVideo();
}

overlay.addEventListener("mousemove", function (e) {
  clearTimeout(mouseTimer);
  overlay.classList.remove("cursor-hidden");
  channelNameDisplay.style.display = "block";
  videoIdDisplay.style.display = "block";
  muteToggle.style.display = "block";
  channelPrev.style.display = "block";
  channelNext.style.display = "block";
  infoButton.style.display = "block";

  const rect = overlay.getBoundingClientRect();
  const xThreshold = rect.width * 0.2;
  const yThreshold = rect.height * 0.2;

  if (
    e.clientX > xThreshold &&
    e.clientX < rect.width - xThreshold &&
    e.clientY > yThreshold &&
    e.clientY < rect.height - yThreshold
  ) {
    mouseTimer = setTimeout(function () {
      overlay.classList.add("cursor-hidden");
      channelNameDisplay.style.display = "none";
      videoIdDisplay.style.display = "none";
      muteToggle.style.display = "none";
      channelPrev.style.display = "none";
      channelNext.style.display = "none";
      infoButton.style.display = "none";
    }, 3000);
  }
});

function toggleMute() {
  if (player.isMuted()) {
    player.unMute();
    muteToggle.textContent = "🔊";
    muteToggle.style.animation = "nothing";
    muteToggle.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
  } else {
    player.mute();
    muteToggle.textContent = "🔇";
    muteToggle.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    muteToggle.style.animation = "muteFlash 1.5s infinte";
  }
}

function switchChannel(direction) {
  const currentIndex = channelNames.indexOf(currentChannel);
  let newIndex =
    (currentIndex + direction + channelNames.length) % channelNames.length;
  currentChannel = channelNames[newIndex];

  const newUrl = new URL(window.location);
  newUrl.searchParams.set("channel", currentChannel);
  window.history.pushState({}, "", newUrl);

  const { videoId, startTime } = getCurrentVideo();
  updateTxt(videoId);
  player.loadVideoById({
    videoId: videoId,
    startSeconds: startTime,
  });

  document.getElementById("static-image").style.display = "block";
  setTimeout(() => {
    document.getElementById("static-image").style.display = "none";
  }, 1000);
}

function showInfo() {
  window.open("https://github.com/card100/YTSurfer", "_blank").focus();
}

var tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
