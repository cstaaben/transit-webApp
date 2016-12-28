<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/../../helpers/StringExtensions.php';
require_once dirname(__FILE__) . '/../../DatabaseAccessLayer.php';
require_once dirname(__FILE__) . '/APostClientRequestMethod.php';
require_once dirname(__FILE__) . '/../STA_Requester.php';

use transit_webApp\DatabaseAccessLayer;

class RouteGeometryClientRequestMethod extends APostClientRequestMethod implements IClientRequestMethod {

    const METHOD_NAME = 'getRouteGeometry';

    public static function getMethodName(): string {
        return self::METHOD_NAME;
    }

    public function executeMethod(): string {
        $params = $this->getParamsFromPost();
        if ($this->hasError){
            return $this->errorMessage;
        }

        $lineDirIds = self::getLineDirIdsFromRouteOnestopID($params);
        if ($this->hasError){
            return $this->errorMessage;
        }

        $geometries = [];
        foreach ($lineDirIds as $direction) {
            $lineDirId = $direction['lineDirId'];
            $geometries[] = json_decode(self::getLineDirGeometry($lineDirId));
        }

        header('Content-Type: application/json');
        return json_encode($geometries);
    }

    public static function getLineDirGeometry(int $lineDirId) : string {
        $useDB = strtolower(parse_ini_file(CONFIG_INI)['use_database_for_route_geometry']) == 'true';

        if ($useDB)
            return DatabaseAccessLayer::getRouteGeometryByLineDirId($lineDirId);
        else {
            $response = STA_Requester::requestRouteGeometry($lineDirId)['body'];
            $dirName = DatabaseAccessLayer::getDirNameByLineDirId($lineDirId);
            return self::buildGeometryFromResult($lineDirId, $dirName, $response);
        }
    }

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
}