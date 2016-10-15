<?php

namespace transit_webApp;

require_once 'models\LatitudeLongitude.php';
require_once 'exceptions\NoResultsException.php';
require_once 'DatabaseAccessLayer.php';

use transit_webApp\models\LatitudeLongitude;
use transit_webApp\exceptions\NoResultsException;

define('CONFIG_INI', 'config.ini');

class TransitManager {

    //region higher level functions

    private static function getBusData(string $route_onestop_id) : string {
        $results = self::getLineDirIdsFromRouteOnestopId($route_onestop_id);
        $busCoords = [];

        //request and format data for each direction
        foreach ($results as $direction) {
            $request = self::buildTravelPointsRequest($direction['lineDirId']);
            $responseJson = self::requestRealTimeManagerData($request);
            $lineDirCoords = self::buildBusDataFromResult($direction['dirName'], $responseJson);
            array_push($busCoords, $lineDirCoords);
        }
        $json = self::formatArrayToJsonObject($busCoords);

        header('Content-Type: application/json');
        return $json;
    }

    private static function getRouteGeometry(string $route_onestop_id) : string {
        $results = DatabaseAccessLayer::convert_route_onestop_id($route_onestop_id);

        $geometries = [];
        foreach ($results as $result) {
            $lineDirId = $result['lineDirId'];
            $geometries[] = json_decode(self::getLineDirGeometry($lineDirId));
        }

        header('Content-Type: application/json');
        return json_encode($geometries);
    }

    private static function getStops(string $latitude, string $longitude, string $radius) : string {
        $latLng = new LatitudeLongitude($latitude, $longitude);
        $radiusInt = intval($radius);
        var_dump(DatabaseAccessLayer::getStopsWithinRadius($latLng, $radiusInt));
        die();
    }

    //endregion high-level functions

    //region mid-level functions

    private static function getLineDirGeometry(int $lineDirId) : string{
        $useDB = strtolower(parse_ini_file(CONFIG_INI)['use_database_for_route_geometry']) == 'true';

        if ($useDB)
            return DatabaseAccessLayer::getRouteGeometryByLineDirId($lineDirId);
        else {
            $response = self::requestRouteGeometry($lineDirId);
            $dirName = DatabaseAccessLayer::getDirNameByLineDirId($lineDirId);
            return self::buildGeometryFromResult($lineDirId, $dirName, $response);
        }
    }

    //endregion

    //region STA request functions

    static function requestRouteGeometry(string $lineDirId) : string {
        $request = self::buildLineTraceRequest($lineDirId);
        return TransitManager::requestInfoWebData($request);
    }

    static function requestRealTimeManagerData(string $request) : string {
        return self::makeSTARequestWithResource($request, 'RealTimeManager');
    }

    private static function requestInfoWebData(string $request) : string {
        return self::makeSTARequestWithResource($request, 'InfoWeb');
    }

    private static function makeSTARequestWithResource(string $request, string $resource) : string {
        $use_proxy = strtolower(parse_ini_file(CONFIG_INI, true)['general']['use_proxies']) == 'true';

        if ($use_proxy)
            return self::makeRequestThroughProxy($request, $resource)['body'];
        else
            return self::makeSTArequest($request, $resource)['body'];
    }

    private static function makeRequestThroughProxy(string $request, string $resource) : array {
        $proxy = "";
        //do {
        $proxy = DatabaseAccessLayer::getNextProxy($proxy);
        $response = self::makeSTArequest($request, $resource, $proxy);
        //} while (!self::isResponseValid($response));
        return $response;
    }

    private static function makeSTArequest(string $request, string $subdir, string $IPv4_Proxy = "") : array {
        $requestHeaders = [
            //'Accept: application/json',
            'Content-Type: application/json',
            'Host: tripplanner.spokanetransit.com:8007',
            'Origin: http://tripplanner.spokanetransit.com:8007',
            'Referer: http://tripplanner.spokanetransit.com:8007/'];

        $ch = curl_init("http://tripplanner.spokanetransit.com:8007/$subdir");
        if (!empty($IPv4_Proxy)) {
            curl_setopt($ch, CURLOPT_PROXY, $IPv4_Proxy);
            //curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
            curl_setopt($ch, CURLOPT_PROXYPORT, 80);
        }
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $requestHeaders);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $request);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        //curl_setopt($ch, CURLOPT_VERBOSE, 1);
        curl_setopt($ch, CURLOPT_HEADER, 1);
        $response = curl_exec($ch);
        $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        curl_close($ch);

        if (empty($response))
            return $response;

        $headers = substr($response, 0, $header_size);
        $body = substr($response, $header_size);
        return ['headers' => $headers, 'body' => $body];
    }

    //endregion STA request functions

    //region STA request helpers

    static function buildGeometryFromResult(string $lineDirId, string $dirName, string $json) : string {
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

    private static function getLineDirIdsFromRouteOnestopId($route_onestop_id) : array {
        try {
            $lineDirIds = DatabaseAccessLayer::convert_route_onestop_id($route_onestop_id);
        } catch (NoResultsException $exception) {
            $lineDirIds = [];
            //TODO: log to file
        }
        return $lineDirIds;
    }

    private static function buildLineTraceRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetLineTrace","params":{"GetLineTraceRequest":{"LineDirId":' . $lineDirId . '}}}';
    }

    private static function buildTravelPointsRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"lineDirId":"' . $lineDirId . '","callingApp":"RMD"}],"interval":10}}';
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

    private static function formatArrayToJsonObject(array $array) : string {
        $json = "{";
        for ($i = 0; $i < count($array); $i++){
            $json .= $array[$i];
            if ($i < count($array)-1)
                $json .= ',';
        }
        $json .= '}';
        return $json;
    }

    //endregion STA request helpers


    public static function makeTransitLandRequest(string $endpoint) : string {
        $transitLandUrl = "https://transit.land/api/v1/$endpoint";
        $ch = curl_init($transitLandUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        //curl_setopt($ch, CURLOPT_VERBOSE, 1);

        $response = curl_exec($ch);
        curl_close($ch);

        return $response;
    }

    //region request helper methods

    private static function validateMethod($method){
        $acceptableMethods = ['getBusData', 'getRouteGeometry', 'getStops'];
        if (!in_array($method, $acceptableMethods, true)) {
            http_response_code(400);
            die();
        }
    }

    private static function getMethodFromRequest() : string {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $post = json_decode(file_get_contents('php://input'), true);
            $method = $post['method'];
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET'){
            $method = $_GET['method'];
        } else {
            http_response_code(405);
            die();
        }
        if ($method == null || $method == "") {
            http_response_code(400);
            die();
        }
        return $method;
    }

    private static function getParamsFromRequest(string $method) : array {
        if ($_SERVER['REQUEST_METHOD'] === 'POST'){
            $post = json_decode(file_get_contents('php://input'), true);
            $params = [$post['params']];
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            if ($method === 'getStops') {
                $params = self::getRequestStopsParamsFromRequest();
            } else {
                http_response_code(400);
                die();
            }
        } else {
            http_response_code(400);
            die();
        }

        return $params;
    }

    private function getRequestStopsParamsFromRequest() : array{
        if (!array_key_exists('lat', $_GET)
            || !array_key_exists('lng', $_GET)
            || !array_key_exists('r', $_GET)) {
            http_response_code(400);
            die();
        }
        else
            return [
                $_GET['lat'],
                $_GET['lng'],
                $_GET['r']
            ];
    }

    //endregion request helper methods


    /**
     * Post body example: {"method":"getBusData","params":"r-12354-00"}
     * @return string
     */
    static function processRequest() : string {
        $method = self::getMethodFromRequest();
        self::validateMethod($method);

        $params = self::getParamsFromRequest($method);

        $method = 'self::' . $method;
        $response = call_user_func_array($method, $params);

        return $response;
    }
}

if (php_sapi_name() !== 'cli')
    print(TransitManager::processRequest());
