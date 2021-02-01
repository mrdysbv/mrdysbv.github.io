var main3dModel = null;

ARBase.prototype.onInit = function () {
    this.clock = new THREE.Clock(),
    this.clock.autoStart = true;

    this.detector = new AR.Detector();
    this.detector.detect = function (image) {
        var qr_data;

        CV.grayscale(image, this.grey);
        CV.adaptiveThreshold(this.grey, this.thres, 2, 7);

        this.contours = CV.findContours(this.thres, this.binary);

        this.candidates = this.findCandidates(this.contours, image.width * 0.20, 0.05, 10);
        this.candidates = this.clockwiseCorners(this.candidates);
        this.candidates = this.notTooNear(this.candidates, 5);

        qr_data = find_QR(this.candidates);
        if (qr_data) {
            return [new AR.Marker(2, qr_data)];
        } else {
            return [];
        }
    };

    this.targetSize = 35.0;
    this.positEstimator = new POS.Posit(this.targetSize, this.canvas.width);

    this.createRendererAndScene();
}

ARBase.prototype.createRendererAndScene = function () {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, canvas.width / canvas.height, 1, 1000);

    this.renderer = new THREE.WebGLRenderer({
        antialias	: true,
        alpha		: true
    });

    this.renderer.setSize(this.video.width, this.video.height);
    document.body.appendChild(this.renderer.domElement);

    var geometry = new THREE.BoxGeometry(1, 1, 1),
        material = new THREE.MeshLambertMaterial({color: 0x009900}),
        loader;

    THREE.CrossDomainJSONLoader = function (showStatus) {
        THREE.JSONLoader.call(this, showStatus);
    };

    loader = new THREE.JSONLoader();

    //animated_mesh;
    var self = this;
    loader.load('resources/models/figure/knight.js', function (geometry, materials) {
        var standard = new THREE.MeshLambertMaterial({color: 0x9999ff}),
            mats,
            mesh,
            scale;

        // material
        for ( var i = 0; i < materials.length; i ++ ) {
            var m = materials[ i ];
            m.skinning = true;
            m.morphTargets = true;
            m.specular.setHSL( 0, 0, 0.1 );
            m.color.setHSL( 0.6, 0, 0.6 );
        }
        
        // mesh
        var mesh = new THREE.SkinnedMesh( geometry, new THREE.MultiMaterial( materials ) );
		mesh.name = "Knight Mesh";
        self.scene.add( mesh );

        self.animated_mesh = mesh;

        // animation
        self.animation_mixer = new THREE.AnimationMixer( mesh );
        self.bones_clip = geometry.animations[0];

        self.anim_action = self.animation_mixer.clipAction( self.bones_clip, null );
        self.anim_action.play();
    });

    this.camera.position.z = 5;

    { // light
        var light = new THREE.DirectionalLight(0xffffff, 1, 100000);
        light.position.set(0, 0, 1);
        this.scene.add(light);
    }
}

ARBase.prototype.onTick = function (videoIsReady) {
    if (videoIsReady) {
        var imageData = this.snapShot();

        var markers = this.detector.detect(imageData);
        this.drawCorners(markers);
        this.updateScene(markers);
        this.render();
    }
}

ARBase.prototype.drawCorners = function (markers) {
    var corners, corner, i, j;

    this.context.lineWidth = 3;

    for (i = 0; i < markers.length; i += 1) {
        corners = markers[i].corners;

        this.context.strokeStyle = "red";
        this.context.beginPath();

        for (j = 0; j < corners.length; j += 1) {
            corner = corners[j];
            this.context.moveTo(corner.x, corner.y);
            corner = corners[(j + 1) % corners.length];
            this.context.lineTo(corner.x, corner.y);
        }

        this.context.stroke();
        this.context.closePath();

        this.context.strokeStyle = "green";
        this.context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

ARBase.prototype.updateScene = function (markers) {
    var corners, corner, pose, i;
    var delta = 0.75 * this.clock.getDelta();

    if (markers.length > 0) {
        this.animated_mesh.visible = true;

        corners = markers[0].corners;

        for (i = 0; i < corners.length; i += 1) {
            corner = corners[i];
            corner.x = corner.x - (this.canvas.width / 2);
            corner.y = (this.canvas.height / 2) - corner.y;
        }

        pose = this.positEstimator.pose(corners);

        this.updateObject(
            this.animated_mesh,
            pose.bestRotation,
            [0.0, 3.14/2.0, 0.0],
            pose.bestTranslation,
            3.0);

        if (this.animation_mixer) {
            this.animation_mixer.update( delta );
        }

    } else {
        if (this.animated_mesh) {
            this.animated_mesh.visible = false;
        }
    }
}

ARBase.prototype.updateObject = function (object, rotation, rotationEuler, translation, scale) {
    object.scale.set(scale, scale, scale);

    object.rotation.x = -Math.asin(-rotation[1][2]) + rotationEuler[0];
    object.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]) + rotationEuler[1];
    object.rotation.z =  Math.atan2(rotation[1][0], rotation[1][1]) + rotationEuler[2];

    object.position.x = translation[0];
    object.position.y = translation[1];
    object.position.z = -translation[2];
}

ARBase.prototype.render = function () {
    this.renderer.render(this.scene, this.camera);
}

ARBase.prototype.animate = function (skinnedMesh) {
    var materials = skinnedMesh.material.materials,
        k;

    for (k in materials) {
        materials[k].skinning = true;
    }

    this.animation = new THREE.Animation(skinnedMesh, skinnedMesh.geometry.animation);
    this.animation.play();
}

////////////////////////////////////////////////

window.onload = function () {
    mainVideo = new ARBase(window, 'canvas', 'video');
    mainVideo.start();
};
