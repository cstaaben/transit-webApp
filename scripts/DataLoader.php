<?php

namespace transit_webApp;

use transit_webApp\factories\StopFactory;

require_once '../services/DatabaseAccessLayer.php';
require_once '../services/TransitManager.php';
require_once '../services/models/Stop.php';
require_once '../services/helpers/StopFactory.php';

class DataLoader {

    static function loadData() {
        print("requesting stops from STA...");
        $lineDirInfos = self::requestAllLineDirInfo();
        print("DONE\n");

        $lineDirIds = self::extractLineDirIds($lineDirInfos);

        //self::updateTable_route_ids($lineDirInfos);
        self::updateTable_stops($lineDirIds);
    }

    /**
     * Populates or updates the entire route_ids table
     * Gets all lineDirIds from STA then matches data from transit.land based on route number
     */
    private static function updateTable_route_ids(array $lineDirInfos) {
        print("updating route ids - requesting data from transit.land...\n");

        DatabaseAccessLayer::setTestMode(true);

        // Query corresponding data from transit.land
        foreach ($lineDirInfos as $lineDirInfo) {
            $dirNames = [];
            $lineDirIds = [];
            foreach ($lineDirInfo['drInfos'] as $lineDirs) {
                array_push($dirNames, $lineDirs['dirName']);
                array_push($lineDirIds, $lineDirs['lineDirId']);
            }

            $routeNum = $lineDirInfo['abbr'];
            $endpoint = "routes?identifier=gtfs://f-c2kx-spokanetransitauthority/r/$routeNum";
            $TransitLandResponse = TransitManager::makeTransitLandRequest($endpoint);
            $route = json_decode($TransitLandResponse, true)['routes'][0];
            $route_onestop_id = $route['onestop_id'];

            for ($i = 0; $i < count($lineDirIds); $i++) {
                print("route $routeNum; route_onestop_id: $route_onestop_id; lineDirId: $lineDirIds[$i]; dirName: $dirNames[$i]\n");
                DatabaseAccessLayer::updateRouteId($route_onestop_id, $lineDirIds[$i], $routeNum, $dirNames[$i]);
            }
        }

        print("...done updating route ids\n");
    }

    private static function updateTable_stops($lineDirIds) {
        print("updating stops...\n");

        $stops = StopFactory::buildStops($lineDirIds);

        //add to database
        print("adding stops to database...\n");
        DatabaseAccessLayer::setTestMode(true);
        foreach ($stops as $stop) {
            print("adding stop " . $stop->getStopId() . "\n");
            DatabaseAccessLayer::updateStop($stop);
        }

        print("...done updating stops\n");
    }

    private static function requestAllLineDirInfo() {
        $postBody = '{"version":"1.1","method":"GetListOfLines"}';
        $STA_response = TransitManager::requestRealTimeManagerData($postBody);
        return json_decode($STA_response, true)['result']['retLineWithDirInfos'];
    }

    private static function extractLineDirIds(array $lineDirInfos) : array {
        $drInfos = [];
        foreach ($lineDirInfos as $lineDirInfo){
            $drInfos = array_merge($drInfos, $lineDirInfo['drInfos']);
        }

        $lineDirIds = [];
        foreach ($drInfos as $drInfo){
            $lineDirIds[] = $drInfo['lineDirId'];
        }

        return $lineDirIds;
    }
}

if (php_sapi_name() === 'cli')
    DataLoader::loadData();