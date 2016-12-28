<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/../../helpers/StringExtensions.php';
require_once dirname(__FILE__) . '/APostClientRequestMethod.php';
require_once dirname(__FILE__) . '/../STA_Requester.php';

use transit_webApp\helpers\StringExtensions;

class BusDataClientRequestMethod extends APostClientRequestMethod implements IClientRequestMethod {

    const METHOD_NAME = 'getBusData';

    public static function getMethodName(): string {
        return self::METHOD_NAME;
    }

    public function executeMethod(): string {
        $params = self::getParamsFromPost();
        if ($this->hasError){
            return $this->errorMessage;
        }

        $lineDirIds = self::getLineDirIdsFromRouteOnestopID($params);
        if ($this->hasError){
            return $this->errorMessage;
        }

        //request and format data for each direction
        $busCoords = [];
        foreach ($lineDirIds as $direction) {
            $response = STA_Requester::requestBusDataForLine($direction['lineDirId']);
            $lineDirCoords = self::buildBusDataFromResult($direction['dirName'], $response['body']);
            array_push($busCoords, $lineDirCoords);
        }
        $json = StringExtensions::formatArrayToJsonObject($busCoords);

        header('Content-Type: application/json');
        return $json;
    }

    private static function buildBusDataFromResult(string $dirName, string $json) : string {
        $busData = json_decode($json, true);
        $locations = $busData["result"]["travelPoints"];
        $busLocations = [];

        foreach ($locations as $location){
            $lat = $location['Lat'];
            $lng = $location['Lon'];
            $heading = $location['Heading'];
            array_push($busLocations, json_decode("{\"lat\": $lat, \"lng\": $lng, \"heading\":$heading}"));
        }

        $busLocations = json_encode($busLocations);
        $returnJson = "\"$dirName\":$busLocations";
        return $returnJson;
    }
}