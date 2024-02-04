const video = document.getElementById("video");

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebCam);

function startWebCam() {
  const searchParams = new URLSearchParams(window.location.search);
  const width = searchParams.get("w");
  const height = searchParams.get("h");
  if (width && height) {
    video.setAttribute("width", width);
    video.setAttribute("height", height);
  }

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((err) => {
      console.error(err);
    });
}

function fillPoly(ctx, points) {
  if (points.length < 3) return;

  ctx.fillStyle = "red";
  ctx.beginPath();
  const first = points.shift();
  ctx.moveTo(first.x, first.y);
  points.forEach((point) => {
    ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  const videoDimensions = {
    width: video.width,
    height: video.height,
  };
  document.body.append(canvas);
  faceapi.matchDimensions(canvas, videoDimensions);

  setInterval(draw, 1000 / 12);

  async function draw() {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();
    const resisizedDetections = faceapi.resizeResults(
      detections,
      videoDimensions
    );
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    resisizedDetections.forEach((face) => {
      fillPoly(ctx, face.landmarks.getLeftEye());
      fillPoly(ctx, face.landmarks.getRightEye());
    });
    //ctx.filter = "blur(5px)";
    // ctx.translate(canvas.width, 0);
    // ctx.scale(-1, 1);
  }
});
