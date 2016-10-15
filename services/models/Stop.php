<?php

namespace transit_webApp\models;

/**
 * Intermediate model Stop
 *
 *
 * Example json:
    {
        "stopId": 2205,
        "abbr": "SCC",
        "name": "Spokane Community College",
        "ivrNum": "3204",
        "pictureFilePath": "",
        "point": {
            "lon": -117.3626,
            "lat": 47.675956
        },
        "stopType": "N",
        "lineDirs": [
            {
                "lineDirId": 52640
            },
            {
                "lineDirId": 52640
            }
        ]
    }
 */
class Stop {
    private $stopId, $json, $latitude, $longitude, $lineDirId;

    private function __construct(int $stopId, string $json, float $latitude, float $longitude, int $lineDirId){
        $this->stopId = $stopId;
        $this->json = $json;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->lineDirId = $lineDirId;
    }

    public static function buildStopsFromDecodedJson($stop) : array {
        $stops = [];

        foreach ($stop['lineDirs'] as $lineDirId) {
            $stopId = intval($stop['stopId']);
            $latitude = floatval($stop['point']['lat']);
            $longitude = floatval($stop['point']['lon']);
            $lineDirId = intval($lineDirId['lineDirId']);
            $stops[] = new Stop($stopId, json_encode($stop), $latitude, $longitude, $lineDirId);
        }

        return $stops;
    }

    public function getStopId() : int { return $this->stopId; }
    public function getJson() : string { return $this->json; }
    public function getLatitude() : float { return $this->latitude; }
    public function getLongitude() : float { return $this->longitude; }
    public function getLineDirId() : int { return $this->lineDirId; }
}