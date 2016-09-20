<?php

namespace transit_webApp;

require_once '../services/DatabaseAccessLayer.php';
require_once '../services/TransitManager.php';


/**
 * Populates or updates the entire route_ids table
 * Gets all lineDirIds from STA then matches data from transit.land based on route number
 */
function updateTable_route_ids() {
    // Query STA
    $postBody = '{"version":"1.1","method":"GetListOfLines"}';
    $STA_response = TransitManager::requestRealTimeManagerData($postBody);
    $result = json_decode($STA_response, true)['result']['retLineWithDirInfos'];

    // Query corresponding data from transit.land
    foreach ($result as $line){
        $lineDirIds = [];
        $dirNames = [];
        foreach ($line['drInfos'] as $lineDirs) {
            array_push($lineDirIds, $lineDirs['lineDirId']);
            array_push($dirNames, $lineDirs['dirName']);
        }

        $routeNum = $line['abbr'];
        $endpoint = "routes?identifier=gtfs://f-c2kx-spokanetransitauthority/r/$routeNum";
        $TransitLandResponse = TransitManager::makeTransitLandRequest($endpoint);
        $route = json_decode($TransitLandResponse, true)['routes'][0];
        $route_onestop_id = $route['onestop_id'];

        for ($i = 0; $i < count($lineDirIds); $i++) {
            print("route $routeNum; route_onestop_id: $route_onestop_id; lineDirId: $lineDirIds[$i]; dirName: $dirNames[$i]\n");
            DatabaseAccessLayer::updateRouteId($route_onestop_id, $lineDirIds[$i], $routeNum, $dirNames[$i]);
        }
    }
}

//TODO: implement updateEntry
function updateEntry_route_ids(string $route_onestop_id) {
    /*
     * $transitLandUrl = "https://transit.land/api/v1/onestop_id/$route_onestop_id"
     * // cURL GET request
     * $name = $response.name
     * //build new cURL request for http://tripplanner.spokanetransit.com:8007/RealTimeManager -> GetListOfLines
     * // match response.retLineWithDirInfos[].abbr with $name to get lineDirIds
     * // update DB through a parameterized query
     */
}


/**
 * For calling from the command line
 */
function processResponse(){
    if (php_sapi_name() !== 'cli')
        die();

    updateTable_route_ids();

}

processResponse();