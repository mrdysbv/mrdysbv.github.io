var DEEP_VERBOSE = false;

function pt(x, y) {
    this.x = x;
    this.y = y;
}

var QRDetectionTrackInfo = QRDetectionTrackInfo || {id:-1, area:-1, corner: new pt(-1,-1), treshold: 0.05};

QRDetectionTrackInfo.clear = function(){
    this.id = -1;
    this.area = -1;
    this.corner.x = -1;
    this.corner.y = -1;
}

function track_QR(candidates){
    if(QRDetectionTrackInfo.id == -1) {

    }
    else{
        return find_QR(candidates);
    }
};

function find_QR(candidates){
    var cand_len = candidates.length;
    if((cand_len< 4 && QRDetectionTrackInfo.id == -1) ||( cand_len < 1 && QRDetectionTrackInfo.id != -1)){ //not enough data
        return;
    }

    for(var i = 0; i < cand_len; ++i){
        candidates[i].area = polygonArea(candidates[i]) ;
    }

    candidates.sort(function(a, b){return -1*(a.area- b.area)});

    if(QRDetectionTrackInfo.id != -1)
    {
        if (DEEP_VERBOSE)
            console.log("old marker");
        var cand_area = candidates[0].area;
        var ratio = cand_area > QRDetectionTrackInfo.area ? QRDetectionTrackInfo.area/cand_area : cand_area/QRDetectionTrackInfo.area;
        if(ratio > 1 - QRDetectionTrackInfo.treshold )
        {
            var idx = findClosestCornerToPoint(candidates[0], QRDetectionTrackInfo.corner);
            arrangeСorners(candidates[0], idx);
            QRDetectionTrackInfo.area = cand_area;
            QRDetectionTrackInfo.corner.x = candidates[0][0].x;
            QRDetectionTrackInfo.corner.y = candidates[0][0].y;
            if (DEEP_VERBOSE)
                console.log("found old marker");
            return candidates[0];
        }
        else{
            if (DEEP_VERBOSE)
                console.log("lost old marker");
            QRDetectionTrackInfo.clear();
            return;
        }

    }

    var res = find3Corners(candidates);
    if(res) {
        var corners = res[0];
        var idx = res[1];
    } else {
        return;
    }

    var frame;

    for(var i = 0; i < idx; ++i){
        if(isPolyInPoly(candidates[i], corners[0]) && isPolyInPoly(candidates[i], corners[1]) && isPolyInPoly(candidates[i], corners[2]) )
        {
            frame = candidates[i];
            break;
        }
    }

    if(frame){
        if (DEEP_VERBOSE)
            console.log("found");
        orientFrame(corners, frame);
        QRDetectionTrackInfo.id = 1;
        QRDetectionTrackInfo.area = frame.area;
        QRDetectionTrackInfo.corner.x =  frame[0].x;
        QRDetectionTrackInfo.corner.y =  frame[0].y;
    }

    return frame;
}

//finds 3 biggest quads with "almost equal" area (corner markers in QR code)
function find3Corners(sorted_candidates){
    if(sorted_candidates.length < 4){
        return undefined;
    }

    for(var i= 0; i < sorted_candidates.length-3; ++i){
        if(checkAreasRatio(sorted_candidates, i, i+3)){
            return [[sorted_candidates[i], sorted_candidates[i+1], sorted_candidates[i+2]],i];
        }
    }

    return undefined;
}

//check if area of rectangles is "almost equal" (with respect to some treshold)
function checkAreasRatio(rects, b, e, treshold){

    if(rects.length < 3){
        return false;
    }

    treshold = treshold || 0.15;
    var ratio = rects[b+1].area/rects[b].area;

    for(var i = 1; i < e-b; ++i){
        if(Math.abs(rects[b+i+1].area/rects[b+i].area - ratio)/ratio > treshold || isPolyInPoly(rects[b+i], rects[b+i+1])){
            return false;
        }
    }
    return true;
}

function findTopLeftQuad(corners){
    var res = 0;
    var ang = 0;
    var points = CreateAveragePointsArray(corners);
    for(var i = 0; i < points.length; ++i){
        var cur_angle = calculateAngle(points[(points.length + i -1)%points.length], points[i], points[(i +1)%points.length]);
        if(cur_angle > ang){
            ang = cur_angle;
            res = i;
        }
    }
    return res;
}

function orientFrame(corners, frame){ //clockwise, starting from top left
    var idx = findTopLeftQuad(corners);
    var p = averagePoint(corners[idx]);
    idx = findClosestCornerToPoint(frame, p);
    arrangeСorners(frame, idx);
}

function findClosestCornerToPoint(frame, p){
    var dst = distance(p,frame[0]);
    var idx = 0;
    for(var i = 1; i < frame.length; ++i){
        var current_dst = distance(p, frame[i]);
        if(current_dst < dst){
            dst = current_dst;
            idx = i;
        }
    }
    return idx;
}

function arrangeСorners(corners, idx){
    if(corners.length < 3 || idx == 0){
        return;
    }

    for(var i = 0; i < idx; ++i){
        var elt = corners.shift();
        corners.push(elt);
    }
}

//utils
function isPolyInPoly(outer, inner){
    for(var i = 0; i < inner.length; ++i){
        if(!isPointInPoly(outer, inner[i])){
            return false;
        }
    }
    return true;
}

function isPointInPoly(poly, pt){
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
        && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
        && (c = !c);
    return c;
}

function polygonArea(polygon, numPoints )
{
    numPoints = numPoints || 4;
    var area = 0;  // Accumulates area in the loop
    var j = numPoints-1;  // The last vertex is the 'previous' one to the first

    for (var i=0; i<numPoints; i++)
    { area = area +  (polygon[j].x+polygon[i].x) * (polygon[j].y-polygon[i].y);
        j = i;  //j is previous vertex to i
    }
    return Math.abs(area/2);
}

function distance(p1, p2){
    return Math.sqrt(Math.pow(p1.x-p2.x,2)+Math.pow(p1.y-p2.y,2));
}

function calculateAngle(p1, p2, p3){ //angle between p1p2 and p2p3
    var a = distance(p2, p3);
    var b = distance(p1, p3);
    var c = distance(p1, p2);
    return Math.acos((a*a + c*c - b*b) / (2*a*c));
}

function CreateAveragePointsArray(arr){
    var res = [];
    for(var i = 0; i < arr.length; ++i){
        res.push(averagePoint(arr[i]));
    }
    return res;
}

function averagePoint(quad){
    var x = 0, y = 0;
    for(var i = 0; i < quad.length; ++i){
        x += quad[i].x;
        y += quad[i].y;
    }
   return new pt(x / quad.length, y / quad.length);
}
