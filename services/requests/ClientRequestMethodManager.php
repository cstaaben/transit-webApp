<?php

namespace transit_webApp\requests;

use transit_webApp\requests\requestMethods\StopsBoundedClientRequestMethod;
use transit_webApp\requests\requestMethods\StopsInRadiusClientRequestMethod;

require_once dirname(__FILE__) . '/requestMethods/InvalidClientRequestMethod.php';
require_once dirname(__FILE__) . '/requestMethods/BusDataClientRequestMethod.php';
require_once dirname(__FILE__) . '/requestMethods/RouteGeometryClientRequestMethod.php';
require_once dirname(__FILE__) . '/requestMethods/StopsInRadiusClientRequestMethod.php';
require_once dirname(__FILE__) . '/requestMethods/StopsBoundedClientRequestMethod.php';

class ClientRequestMethodManager {

    private static $methodRegistry = [];
    private static $hasRegistered = false;

    public static function getClientRequestMethod() : IClientRequestMethod {
        if (!self::$hasRegistered)
            self::registerMethods();

        $methodName = self::getMethodNameFromRequest();
        if (!array_key_exists($methodName, self::$methodRegistry)) {
            $methodName = InvalidClientRequestMethod::getMethodName();
        }

        $method = self::$methodRegistry[$methodName];
        return call_user_func($method);
    }

    private static function registerMethods(){
        self::$methodRegistry[InvalidClientRequestMethod::getMethodName()] = function(){ return new InvalidClientRequestMethod(); };
        self::$methodRegistry[BusDataClientRequestMethod::getMethodName()] = function(){ return new BusDataClientRequestMethod(); };
        self::$methodRegistry[RouteGeometryClientRequestMethod::getMethodName()] = function(){ return new RouteGeometryClientRequestMethod(); };
        self::$methodRegistry[StopsInRadiusClientRequestMethod::getMethodName()] = function(){ return new StopsInRadiusClientRequestMethod(); };
        self::$methodRegistry[StopsBoundedClientRequestMethod::getMethodName()] = function(){ return new StopsBoundedClientRequestMethod(); };

        self::$hasRegistered = true;
    }

    private static function getMethodNameFromRequest() : string {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $post = json_decode(file_get_contents('php://input'), true);
            $methodName = $post['method'];
        } else if ($_SERVER['REQUEST_METHOD'] === 'GET'){
            $methodName = $_GET['method'];
        } else {
            $methodName = InvalidClientRequestMethod::getMethodName();
        }

        return $methodName;
    }
}