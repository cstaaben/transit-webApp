<?php

namespace transit_webApp\requests\requestMethods;

require_once dirname(__FILE__) . '/../../models/LatitudeLongitude.php';
require_once dirname(__FILE__) . '/../../DatabaseAccessLayer.php';

use transit_webApp\models\LatitudeLongitude;
use transit_webApp\requests\AClientRequestMethod;
use transit_webApp\requests\IClientRequestMethod;
use transit_webApp\DatabaseAccessLayer;

class StopsBoundedClientRequestMethod extends AClientRequestMethod implements IClientRequestMethod {

    const METHOD_NAME = 'getStopsBounded';
    private $northBound = 0.0;
    private $eastBound = 0.0;
    private $southBound = 0.0;
    private $westBound = 0.0;

    public static function getMethodName(): string {
        return self::METHOD_NAME;
    }

    public function executeMethod(): string {
        $this->loadParams();
        $northEast = new LatitudeLongitude($this->northBound, $this->eastBound);
        $southWest = new LatitudeLongitude($this->southBound, $this->westBound);
        $stops = DatabaseAccessLayer::getStopsWithinBounds($northEast, $southWest);

        header('Content-Type: application/json');
        return json_encode($stops);
    }

    private function loadParams(){
        if (!array_key_exists('northBound', $_GET)
            || !array_key_exists('eastBound', $_GET)
            || !array_key_exists('eastBound', $_GET)
            || !array_key_exists('eastBound', $_GET)){
            $this->hasError = true;
            $this->httpResponseCode = 400;
            $this->errorMessage = 'missing params';
        } else {
            $this->northBound = $_GET['northBound'];
            $this->eastBound = $_GET['eastBound'];
            $this->southBound = $_GET['southBound'];
            $this->westBound = $_GET['westBound'];
        }
    }
}