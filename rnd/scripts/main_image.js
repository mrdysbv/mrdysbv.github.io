var mainImage = null;


ARBase.prototype.onInit = function () {
    this.element = document.getElementById('pinned-corners-img');
    
    this.detector = new AR.Detector();
    this.detector.detect = function (image) {
        CV.grayscale(image, this.grey);
        CV.adaptiveThreshold(this.grey, this.thres, 2, 7);

        this.contours = CV.findContours(this.thres, this.binary);

        this.candidates = this.findCandidates(this.contours, image.width * 0.20, 0.05, 10);
        this.candidates = this.clockwiseCorners(this.candidates);
        this.candidates = this.notTooNear(this.candidates, 5);

        var qr_data = find_QR(this.candidates);
        if (qr_data) {
            return [new AR.Marker(2, qr_data)];
        } else {
            return [];
        }
    };
}

ARBase.prototype.onTick = function (videoIsReady) {
    if (videoIsReady) {
        var imageData = this.snapShot();

        var markers = this.detector.detect(imageData);

        if (markers.length > 0) { //if we detected marker
            var idx = [0, 1, 3, 2], //correct order of marker vertices for pinned corners function
                corners = [],
        //we arrange marker corners in idx order and map from video to window coordinates
                rect = video.getBoundingClientRect(),
                i;

            for (i = 0; i < 4; i += 1) {
                corners.push(markers[0].corners[idx[i]]);
                corners[i].x = rect.left + corners[i].x;
                corners[i].y = rect.top + corners[i].y;
            }

            pinСorners(this.element,
                       corners[0].x, corners[0].y,
                       corners[1].x, corners[1].y,
                       corners[2].x, corners[2].y,
                       corners[3].x, corners[3].y);

            this.element.style.visibility = "visible";
        } else {
            this.element.style.visibility = "hidden";
        }
    }
}

////////////////////////////////////////////////

window.onload = function () {
    mainImage = new ARBase(window, 'canvas', 'video');
    mainImage.start();
};
