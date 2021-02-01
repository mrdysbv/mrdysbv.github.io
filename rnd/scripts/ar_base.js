var ARBase = function (window_, canvasElName, videoElName) {
    this.window = window_;

    this.canvas = document.getElementById(canvasElName);
    this.context = this.canvas.getContext('2d');

    this.video = document.getElementById(videoElName);

    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.initCamera();

    if (this.onInit) {
        this.onInit();
    }
};

ARBase.prototype.initCamera = function () {
    if (!this.window.URL) {
        this.window.URL = this.window.URL || this.window.webkitURL || this.window.msURL || this.window.oURL;
    }

    if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }

    var self = this;

    this.window.navigator.getUserMedia({
        video: true,
        audio: false
    }, function (stream) {
        try {
            self.video.src = self.window.URL.createObjectURL(stream);
//            init();
        } catch (err) {
            self.video.src = stream;
        }
    }, function () {
        throw new Error('Cannot capture user camera.');
    });
};

ARBase.prototype.start = function () {

    // window animation
    this.window.requestAnimationFrame(this.tick.bind(this));
};

ARBase.prototype.tick = function () {
    var videoIsReady = this.video.readyState === this.video.HAVE_ENOUGH_DATA;
    
    if (this.onTick) {
        this.onTick(videoIsReady);
    }

    // window animation
    this.window.requestAnimationFrame(this.tick.bind(this));
};

ARBase.prototype.snapShot = function () {
    this.context.drawImage(this.video, 0, 0, this.width, this.height);
    var imageData = this.context.getImageData(0, 0, this.width, this.height);
    return imageData;
};
