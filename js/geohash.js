// geohash.js
// Geohash library for Javascript
// (c) 2008 David Troy
// (c) 2011 inuro
// (c) 2011 Chv
// Distributed under the MIT License
// from https://github.com/chv/geohash-js

(function(){
    if(typeof GeoHash === 'undefined' || !GeoHash){
        GeoHash = (function(){
            var BITS = [16, 8, 4, 2, 1],
                BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz",
                OPPOSITE = {"left": "right", "right": "left", "top": "bottom", "bottom": "top"},
                NEIGHBORS = {
                    right  : { even :  "bc01fg45238967deuvhjyznpkmstqrwx" },
                    left   : { even :  "238967debc01fg45kmstqrwxuvhjyznp" },
                    top    : { even :  "p0r21436x8zb9dcf5h7kjnmqesgutwvy" },
                    bottom : { even :  "14365h7k9dcfesgujnmqp0r2twvyx8zb" }
                },
                BORDERS = {
                    right  : { even : "bcfguvyz" },
                    left   : { even : "0145hjnp" },
                    top    : { even : "prxz" },
                    bottom : { even : "028b" }
                };

            NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
            NEIGHBORS.top.odd = NEIGHBORS.right.even;
            NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
            NEIGHBORS.right.odd = NEIGHBORS.top.even;

            BORDERS.bottom.odd = BORDERS.left.even;
            BORDERS.top.odd = BORDERS.right.even;
            BORDERS.left.odd = BORDERS.bottom.even;
            BORDERS.right.odd = BORDERS.top.even;

            //constructor of HashObject
            function HashObject(hashcode, lat1, lat2, lon1, lon2){
                this.hashcode = hashcode || "";
                this.latitude = [lat1, lat2];
                this.longitude = [lon1, lon2];

                return this;
            }
            HashObject.prototype = {
                toString: function(){
                    return this.hashcode;
                },
                //return 4 points for drawing as rect
                rect: function(){
                    return [
                        {latitude: this.latitude[0], longitude: this.longitude[0]},
                        {latitude: this.latitude[0], longitude: this.longitude[1]},
                        {latitude: this.latitude[1], longitude: this.longitude[1]},
                        {latitude: this.latitude[1], longitude: this.longitude[0]}
                    ];
                },
                //return center position
                center: function(){
                    return {
                        latitude: (this.latitude[0] + this.latitude[1]) / 2,
                        longitude: (this.longitude[0] + this.longitude[1]) / 2
                    };
                },
                //return neighbor hashobject
                neighbor: function(dir){
                    var nexthashcode = calculateAdjacent(this.hashcode, dir);
                    if (nexthashcode == null) throw "End of world";
                    return decodeGeoHash(nexthashcode);
                },

                // distanace to an other HashObject
                distance: function(hashObject) {
                    var position1 = this.center(),
                        position2 = hashObject.center(),
                        lat1 = position1.latitude,
                        lon1 = position1.longitude,
                        lat2 = position2.latitude,
                        lon2 = position2.longitude,
                        R = 6371, // km
                        dLat = (lat2-lat1).toRad(),
                        dLon = (lon2-lon1).toRad(),
                        a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(Number(lat1).toRad()) * Math.cos(Number(lat2).toRad()) *
                            Math.sin(dLon/2) * Math.sin(dLon/2),
                        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    return R * c;
                }
            }

            function calculateAdjacent(hashcode, dir) {
                if (!hashcode) return null;
                var hashcode = hashcode.toLowerCase(),
                    lastChr = hashcode.charAt(hashcode.length-1),
                    type = (hashcode.length % 2) ? 'odd' : 'even',
                    basecode = hashcode.substring(0, hashcode.length-1);
                if (BORDERS[dir][type].indexOf(lastChr)!=-1){
                    basecode = calculateAdjacent(basecode, dir);
                    if (!basecode) return null;
                }
                return basecode + BASE32.charAt(NEIGHBORS[dir][type].indexOf(lastChr));
            }

            function decodeGeoHash(hashcode) {
                var is_even = 1,
                    lat = [-90.0, 90.0],
                    lon = [-180.0, 180.0],
                    precision = hashcode.length,
                    i, bit, c, cd, index, target;

                for (i=0; i<precision; i++) {
                    c = hashcode.charAt(i);
                    cd = BASE32.indexOf(c);
                    for (bit=0; bit<5; bit++) {
                        index = cd & BITS[bit] ? 0 : 1;
                        target = is_even ? lon : lat;
                        target[index] = (target[0] + target[1])/2;
                        is_even = !is_even;
                    }
                }
                return new HashObject(hashcode, lat[0], lat[1], lon[0], lon[1]);
            }

            function encodeGeoHash(latitude, longitude, precision) {
                var is_even = 1,
                    lat = {from: -90.0, to: 90.0, point: latitude},
                    lon = {from: -180.0, to: 180.0, point: longitude},
                    precision = precision || 12,
                    hashcode = "",
                    ch, bit, mid, target;

                while (hashcode.length < precision){
                    ch = 0;
                    for(bit=0; bit<5; bit++){
                        target = is_even ? lon : lat;
                        mid = (target.from + target.to) / 2;
                        if (target.point >= mid) {
                            ch |= BITS[bit];
                            target.from = mid;
                        }
                        else{
                            target.to = mid;
                        }
                        is_even = !is_even;
                    }
                    hashcode += BASE32.charAt(ch);
                }
                return new HashObject(hashcode, lat.from, lat.to, lon.from, lon.to);
            }

            function encodeLine2GeoHash(lat1, lon1, lat2, lon2, precision){
                var result = [],
                    availableVerticalDir = lat2 == lat1 ? "none" : (lat2 - lat1 > 0 ? "top" : "bottom"),
                    availableHorizontalDir = lon2 == lon1 ? "none" : (lon2 - lon1 > 0 ? "right" : "left"),
                    hashobj1= encodeGeoHash(lat1, lon1, precision),
                    edge,
                    walkline = function(hashobj, fromdir){
                        var i, dir,
                            seg = [
                                {lat1: hashobj.latitude[0], lon1: hashobj.longitude[0], lat2: hashobj.latitude[0], lon2: hashobj.longitude[1], edge: "bottom"},
                                {lat1: hashobj.latitude[0], lon1: hashobj.longitude[1], lat2: hashobj.latitude[1], lon2: hashobj.longitude[1], edge: "right"},
                                {lat1: hashobj.latitude[1], lon1: hashobj.longitude[1], lat2: hashobj.latitude[1], lon2: hashobj.longitude[0], edge: "top"},
                                {lat1: hashobj.latitude[1], lon1: hashobj.longitude[0], lat2: hashobj.latitude[0], lon2: hashobj.longitude[0], edge: "left"}
                            ];

                        result.push(hashobj);
                        for(i=0; i<4; i++){
                            edge = seg[i].edge;
                            if(edge == availableVerticalDir || edge == availableHorizontalDir){
                                if(intersectLineSegment(lat1, lon1, lat2, lon2, seg[i].lat1, seg[i].lon1, seg[i].lat2, seg[i].lon2)){
                                    dir = edge;
                                    if(dir !== fromdir){
                                        walkline(hashobj.neighbor(dir), OPPOSITE[dir]);
                                        return;
                                    }
                                }
                            }
                        }
                        return;
                    };

                walkline(hashobj1, "");
                return result;
            }

            function intersectLineSegment(lat1, lon1, lat2, lon2, lat3, lon3, lat4, lon4){
                return (
                    ((lon2 - lon1) * (lat4 - lat3)) - ((lon4 - lon3) * (lat2 - lat1)) != 0 //parallel check
                    &&	((lon1 - lon2) * (lat3 - lat1) + (lat1 - lat2) * (lon1 - lon3)) * ((lon1 - lon2) * (lat4 - lat1) + (lat1 - lat2) * (lon1 - lon4)) <= 0
                    &&	((lon3 - lon4) * (lat1 - lat3) + (lat3 - lat4) * (lon3 - lon1)) * ((lon3 - lon4) * (lat2 - lat3) + (lat3 - lat4) * (lon3 - lon2)) <= 0
                );
            }

            /**
             * Calculates the (max.) eight neighboring hashes of the specified hash,
             * including diagonal neighbors.
             * On north/south pole there may be less than eight neighbors.
             *
             * @param {String} central geohash
             *
             * @return Array of neighbors, starting from the key directly above the
             *         central key and proceeding clockwise.
             */
            function calculateNeighborCodes(hashcode) {
                var top = calculateAdjacent(hashcode, 'top'),
                    right = calculateAdjacent(hashcode, 'right'),
                    bottom = calculateAdjacent(hashcode, 'bottom'),
                    left = calculateAdjacent(hashcode, 'left'),
                    top_left = top_right = bottom_left = bottom_right = null;
                if (top) {
                    top_left = calculateAdjacent(top, 'left');
                    top_right = calculateAdjacent(top, 'right');
                }
                if (bottom) {
                    bottom_left = calculateAdjacent(bottom, 'left');
                    bottom_right = calculateAdjacent(bottom, 'right');
                }
                return [
                    top,
                    top_right,
                    right,
                    bottom_right,
                    bottom,
                    bottom_left,
                    left,
                    top_left
                ].filter(function(hash){ return hash !== null });
            }

            //return interface
            return {
                encode: encodeGeoHash,
                decode: decodeGeoHash,
                calculateNeighborCode: calculateAdjacent,
                calculateNeighborCodes: calculateNeighborCodes,
                encodeLine: encodeLine2GeoHash,
                //old interface names
                encodeGeoHash: encodeGeoHash,
                decodeGeoHash: decodeGeoHash,
                calculateAdjacent: calculateAdjacent
            };
        })();

        // Converts numeric degrees to radians
        if (typeof(Number.prototype.toRad) === "undefined") {
            Number.prototype.toRad = function() {
                return this * Math.PI / 180;
            }
        }

        //commonJS interface
        if(typeof exports === 'undefined'){
            exports = {};
        }
        exports.GeoHash = GeoHash;
    }
})();