/**
 * Encapsulates calls to STA
 */

var listOfRoutes = {};
var lineTraces = {};
var stopsForLine = {};

function getListOfLines(){
    if ($.isEmptyObject(listOfRoutes)) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'application/json',
            data: '{"request":{"version":"1.1","method":"GetListOfLines"},"resource":"RealTimeManager"}',
            success: function(data){ listOfRoutes = $.parseJSON(data).result.retLineWithDirInfos; },
            async: false
        });
    }

    return listOfRoutes;
}

function getLineTrace(lineDirId){
    if (!lineTraces[lineDirId])
    $.ajax({
        type: "POST",
        url: '../services/transit.php',
        dataType: 'application/json',
        data: '{"request":{version:"1.1",method:"GetLineTrace",params:{GetLineTraceRequest:{LineDirId:' + lineDirId + '}}},"resource":"InfoWeb"}',
        success: function(data){ lineTraces[lineDirId] = $.parseJSON(data).GoogleMap[0]; },
        async: false
    });
    return lineTraces.lineDirId;
}

function getTravelPoints(lineDirId){
    var travelPoints = '';
    $.ajax({
        type: "POST",
        url: '../services/transit.php',
        dataType: 'application/json',
        data: '{"request":{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"' + lineDirId + '":"52490","callingApp":"RMD"}],"interval":10}}, "resource":"RealTimeManager"}',
        success: function(data){ travelPoints = $.parseJSON(data).result.travelPoints; },
        async: false
    });
    return travelPoints;
}

function getStopsForLine(lineDirId){
    if (!stopsForLine[lineDirId]) {
        $.ajax({
            type: "POST",
            url: '../services/transit.php',
            dataType: 'application/json',
            data: '{"request":{"version":"1.1","method":"GetStopsForLine","params":{"reqLineDirIds":[{"lineDirId":' + lineDirId + '}]}},"resource":"RealTimeManager"}',
            success: function(data) { stopsForLine[lineDirId] = $.parseJSON(data).result.stops; },
            async: false
        });
    }

    return stopsForLine[lineDirId];
}