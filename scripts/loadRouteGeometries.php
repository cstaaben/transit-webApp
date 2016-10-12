<?php
/**
 * For loading route geometries into the database. Consider running it on a regular basis.
 */

namespace transit_webApp;

use PDO;

require_once '../services/TransitManager.php';

define('CREDS_PATH', '../services/creds.ini');


function loadRouteGeometries(){
    DatabaseAccessLayer::setTestMode(true);
    $lineDirIds = getLineDirIds();
    foreach ($lineDirIds as $result) {
        $lineDirId = $result['lineDirId'];
        $dirName = $result['dirName'];
        echo("requesting line trace of lineDirId $lineDirId...");
        $route_geometry = TransitManager::requestRouteGeometry($lineDirId);
        echo("done\n");
        $formatted_route_geometry = TransitManager::buildGeometryFromResult($lineDirId, $dirName, $route_geometry);
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

function insertRouteGeometry(string $lineDirId, string $route_geometry) {
    $dbo = DatabaseAccessLayer::getDatabaseConnection();
    $query = "INSERT INTO route_geometry (lineDirId, route_geometry) VALUES ($lineDirId, '$route_geometry') ON DUPLICATE KEY UPDATE route_geometry='$route_geometry';";
    $dbo->query($query);
}

loadRouteGeometries();
