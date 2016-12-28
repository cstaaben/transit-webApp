<?php

namespace transit_webApp\helpers;

use transit_webApp\models\Stop;
use transit_webApp\TransitManager;

/**
 * For building all stops from retrieved from:
 *      POST http://tripplanner.spokanetransit.com:8007/RealTimeManager
 *      {"version":"1.1","method":"GetStopsForLine","params":{"reqLineDirIds":[{"lineDirId":$lineDirId}]}}
 */
class StopFactory {

    /**
     * @param $allLineDirs array of lineDirIds
     * @return array of Stops
     */
    public static function buildStops(array $allLineDirs) : array {
        //get all of the stop objects decoded from json

        $allStops = [];
        foreach ($allLineDirs as $line) {
            print("requesting stops for lineDirId $line... ");
            $postData = '{"version":"1.1","method":"GetStopsForLine","params":{"reqLineDirIds":[{"lineDirId":' . $line . '}]}}';
            $response = TransitManager::requestRealTimeManagerData($postData);
            print("got it\n");
            $stops = json_decode($response, true)['result']['stops'];
            $allStops = array_merge($allStops, $stops);
        }

        //convert them all into Stop objects
        $stopObjects = [];
        foreach ($allStops as $stop) {
            $stopObjects = array_merge($stopObjects, Stop::buildStopsFromDecodedJson($stop));
        }
        return $stopObjects;
    }
}