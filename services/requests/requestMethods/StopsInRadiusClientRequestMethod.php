<?php

namespace transit_webApp\requests\requestMethods;

require_once dirname(__FILE__) . '/../../models/LatitudeLongitude.php';
require_once dirname(__FILE__) . '/../../DatabaseAccessLayer.php';

use transit_webApp\requests\AClientRequestMethod;
use transit_webApp\requests\IClientRequestMethod;
use transit_webApp\models\LatitudeLongitude;
use transit_webApp\DatabaseAccessLayer;

class StopsInRadiusClientRequestMethod extends AClientRequestMethod implements IClientRequestMethod {

    const METHOD_NAME = 'getStopsInRadius';
    private $latitude = '';
    private $longitude = '';
    private $radius = 1000;

    public static function getMethodName(): string {
        return self::METHOD_NAME;
    }

    public function executeMethod(): string {
        $this->loadParams();
        if ($this->hasError){
            return $this->errorMessage;
        }

        $latLng = new LatitudeLongitude($this->latitude, $this->longitude);
        $radiusInt = intval($this->radius);
        $stops = DatabaseAccessLayer::getStopsWithinRadius($latLng, $radiusInt);

        header('Content-Type: application/json');
        return json_encode($stops);
    }

    private function loadParams() {
        if (!array_key_exists('lat', $_GET)
            || !array_key_exists('lng', $_GET)
            || !array_key_exists('r', $_GET)) {
            $this->hasError = true;
            $this->httpResponseCode = 400;
            $this->errorMessage = 'missing params';
        } else {
            $this->latitude = $_GET['lat'];
            $this->longitude = $_GET['lng'];
            $this->radius = $_GET['r'];
        }
    }
}