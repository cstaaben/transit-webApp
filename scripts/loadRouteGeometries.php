<?php
/**
 * For loading route geometries into the database. Consider running it on a regular basis.
 */

namespace transit_webApp;

use PDO;

require_once '../services/TransitManager.php';
//require_once '../services/DatabaseAccessLayer.php';

define('CREDS_PATH', '../services/creds.ini');


function loadRouteGeometries(){
    DatabaseAccessLayer::setTestMode(true);
    $lineDirIds = getLineDirIds();
    foreach ($lineDirIds as $result) {
        $lineDirId = $result['lineDirId'];
        $dirName = $result['dirName'];
        echo("requesting line trace of lineDirId $lineDirId...");
        $route_geometry = requestRouteGeometry($lineDirId);
        echo("done\n");
        $formatted_route_geometry = buildGeometryFromResult($lineDirId, $dirName, $route_geometry);
        insertRouteGeometry($lineDirId, $formatted_route_geometry);
    }
}

function getLineDirIds() : array {
    $dbo = DatabaseAccessLayer::getDatabaseConnection();
    $query = "SELECT lineDirId, dirName FROM route_ids;";
    $statement = $dbo->query($query);
    $result = $statement->fetchAll(PDO::FETCH_ASSOC);
    return $result;
}

function requestRouteGeometry(string $lineDirId) : string {
    $request = buildLineTraceRequest($lineDirId);
    $responseJson = TransitManager::requestInfoWebData($request);
    return $responseJson;
}

function buildGeometryFromResult(string $lineDirId, string $dirName, string $json) : string {
    $lineData = json_decode($json, true)['result'][0]['GoogleMap'];

    //add all points
    $points = [];
    foreach ($lineData as $segment)
        array_push($points, $segment['Points']);
    $lineData = $lineData[0];

    //add/set properties
    $lineData['Points'] = $points;
    $lineData['lineDirId'] = $lineDirId;
    $lineData['dirName'] = $dirName;

    //replace for quicker consumption clientside
    $lineData = json_encode($lineData);
    $lineData = str_replace("Lat", "lat", $lineData);
    $lineData = str_replace("Lon", "lng", $lineData);
    return $lineData;
}

function buildLineTraceRequest(string $lineDirId) : string {
    return '{"version":"1.1","method":"GetLineTrace","params":{"GetLineTraceRequest":{"LineDirId":' . $lineDirId . '}}}';
}

function insertRouteGeometry(string $lineDirId, string $route_geometry) {
    $dbo = DatabaseAccessLayer::getDatabaseConnection();
    $query = "INSERT INTO route_geometry (lineDirId, route_geometry) VALUES ($lineDirId, '$route_geometry') ON DUPLICATE KEY UPDATE route_geometry='$route_geometry';";
    $dbo->query($query);
}

loadRouteGeometries();