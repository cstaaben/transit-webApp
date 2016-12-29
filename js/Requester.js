/**
 * Encapsulates calls to transit.php
 */

let listOfRoutes = {};
let lineTraces = {};
let stopsForLine = {};

export default class Requester {

    static getListOfLines() {
        if ($.isEmptyObject(listOfRoutes)) {
            $.ajax({
                type: "POST",
                url: '../services/transit.php',
                dataType: 'json',
                data: '{"request":{"version":"1.1","method":"GetListOfLines"},"resource":"RealTimeManager"}',
                success: function(data) {
                    listOfRoutes = $.parseJSON(data).result.retLineWithDirInfos;
                },
                async: false
            });
        }

        return listOfRoutes;
    }

    static getLineTrace(lineDirId) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'json',
            data: '{"request":{version:"1.1",method:"GetLineTrace",params:{GetLineTraceRequest:{LineDirId:' + lineDirId + '}}},"resource":"InfoWeb"}',
            success: function(data) {
                lineTraces[lineDirId] = $.parseJSON(data).GoogleMap[0];
            },
            async: false
        });
        return lineTraces.lineDirId;
    }

    static getTravelPoints(lineDirId) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'json',
            data: '{"request":{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"' + lineDirId + '":"52490","callingApp":"RMD"}],"interval":10}}, "resource":"RealTimeManager"}',
            success: function(data) {
                travelPoints = $.parseJSON(data).result.travelPoints;
            },
            async: false
        });
        return travelPoints;
    }

    static getStopsForLineSTA(lineDirId) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'json',
            data: '{"request":{"version":"1.1","method":"GetStopsForLine","params":{"reqLineDirIds":[{"lineDirId":' + lineDirId + '}]}},"resource":"RealTimeManager"}',
            success: function(data) {
                stopsForLine[lineDirId] = $.parseJSON(data).result.stops;
            },
            async: false
        });

        return stopsForLine[lineDirId];
    }

    static getStopsForRoute(route_onestop_id) {
        return $.ajax({
            url: "https://transit.land/api/v1/stops?served_by=" + route_onestop_id,
            dataType: 'json'
        });
    }

    static requestBusData(route_onestop_id) {
        return $.ajax({
            type: "POST",
            url: '/transit-webApp/services/TransitManager.php',
            dataType: 'json',
            data: '{"method":"getBusData","params":"' + route_onestop_id + '"}'
        });
    }

    static requestRouteGeometry(route_onestop_id) {
        return $.ajax({
            type: "POST",
            url: '/transit-webApp/services/TransitManager.php',
            dataType: 'json',
            data: '{"method":"getRouteGeometry","params":"' + route_onestop_id + '"}'
        });
    }

    static requestStopsAtCoordinates(latitude, longitude, radius) {
        return $.ajax({
            type: "GET",
            url: '/transit-webApp/services/TransitManager.php?method=getStopsInRadius&lat=' + latitude + '&lng=' + longitude + '&r=' + radius,
            dataType: 'json'
        });
    }

    static requestStopsInBounds(northBound, eastBound, southBound, westBound) {
        return $.ajax({
            type: "GET",
            url: '/transit-webApp/services/TransitManager.php?method=getStopsBounded&northBound=' + northBound + '&eastBound=' + eastBound + '&southBound=' + southBound + '&westBound=' + westBound,
            dataType: 'json'
        });
    }

    static requestGeocoding(location, callback){
        const requestAddress = "https://maps.googleapis.com/maps/api/geocode/json?address=" + location + "&key=" + API_KEY_UNRESTRICTED;
        $.getJSON(requestAddress, "", function(data) { callback(data); });
    }
}