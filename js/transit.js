//TODO: encapsulate in singleton scope
/**
 * Encapsulates calls to transit.php
 */

var listOfRoutes = {};
var lineTraces = {};
var stopsForLine = {};

function getListOfLines(){
    if ($.isEmptyObject(listOfRoutes)) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'json',
            data: '{"request":{"version":"1.1","method":"GetListOfLines"},"resource":"RealTimeManager"}',
            success: function(data){ listOfRoutes = $.parseJSON(data).result.retLineWithDirInfos; },
            async: false
        });
    }

    return listOfRoutes;
}

function getLineTrace(lineDirId){
    $.ajax({
        type: "POST",
        url: '../services/transit.php',
        dataType: 'json',
        data: '{"request":{version:"1.1",method:"GetLineTrace",params:{GetLineTraceRequest:{LineDirId:' + lineDirId + '}}},"resource":"InfoWeb"}',
        success: function(data){ lineTraces[lineDirId] = $.parseJSON(data).GoogleMap[0]; },
        async: false
    });
    return lineTraces.lineDirId;
}

function getTravelPoints(lineDirId){
    $.ajax({
        type: "POST",
        url: '../services/transit.php',
        dataType: 'json',
        data: '{"request":{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"' + lineDirId + '":"52490","callingApp":"RMD"}],"interval":10}}, "resource":"RealTimeManager"}',
        success: function(data){ travelPoints = $.parseJSON(data).result.travelPoints; },
        async: false
    });
    return travelPoints;
}

function getStopsForLineSTA(lineDirId){
    $.ajax({
        type: "POST",
        url: '../services/transit.php',
        dataType: 'json',
        data: '{"request":{"version":"1.1","method":"GetStopsForLine","params":{"reqLineDirIds":[{"lineDirId":' + lineDirId + '}]}},"resource":"RealTimeManager"}',
        success: function(data) { stopsForLine[lineDirId] = $.parseJSON(data).result.stops; },
        async: false
    });

    return stopsForLine[lineDirId];
}

function getStopsForRoute(route_onestop_id){
    return $.ajax({
        url: "https://transit.land/api/v1/stops?served_by=" + route_onestop_id,
        dataType: 'json'
    });
}

function requestBusData(route_onestop_id){
    return $.ajax({
        type: "POST",
        url: '/transit-webApp/services/TransitManager.php',
        dataType: 'json',
        data: '{"method":"requestBusData","params":"' + route_onestop_id + '"}'
    });
}

function requestRouteGeometry(route_onestop_id){
    return $.ajax({
        type: "POST",
        url: '/transit-webApp/services/TransitManager.php',
        dataType: 'json',
        data: '{"method":"requestRouteGeometry","params":"' + route_onestop_id + '"}'
    });
}

function requestStopsAtCoordinates(latitude, longitude, radius){
    return $.ajax({
        type: "GET",
        url: '/transit-webApp/services/TransitManager.php?method=getStops&lat=' + latitude + '&lng=' + longitude + '&r=' + radius,
        dataType: 'json'
    });
}

function requestStopsInBounds(northBound, eastBound, southBound, westBound){
    return $.ajax({
        type: "GET",
        url: '/transit-webApp/services/TransitManager.php?method=getStopsBounded&northBound=' + northBound + '&eastBound=' + eastBound + '&southBound=' + southBound + '&westBound=' +westBound,
        dataType: 'json'
    });
}