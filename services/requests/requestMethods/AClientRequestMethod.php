<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/../../exceptions/NoResultsException.php';
require_once dirname(__FILE__) . '/../../DatabaseAccessLayer.php';

use transit_webApp\exceptions\NoResultsException;
use transit_webApp\DatabaseAccessLayer;

abstract class AClientRequestMethod {

    protected $hasError = false;
    protected $errorMessage = '';
    protected $httpResponseCode = 200;

    public function getResponseCode() : int {
        return $this->httpResponseCode;
    }

    protected function getLineDirIdsFromRouteOnestopID($routeOnestopId){
        try {
            $results = DatabaseAccessLayer::convert_route_onestop_id($routeOnestopId);
            if (empty($results)) {
                $this->hasError = true;
                $this->httpResponseCode = 400;
                $this->errorMessage = "unknown routeOnestopId: $routeOnestopId";
            }
        } catch (NoResultsException $exception) {
            $results = [];
            //TODO: log to file
        }
        return $results;
    }
}