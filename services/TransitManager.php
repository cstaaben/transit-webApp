<?php

namespace transit_webApp;
require_once dirname(__FILE__) . '/requests/ClientRequestMethodManager.php';

use transit_webApp\requests\ClientRequestMethodManager;


define('CONFIG_INI', 'config.ini');

class TransitManager {

    public static function processRequest() : string {
        $clientRequestMethod = ClientRequestMethodManager::getClientRequestMethod();
        $response = $clientRequestMethod->executeMethod();
        $responseCode = $clientRequestMethod->getResponseCode();

        http_response_code($responseCode);
        return $response;
    }

    public static function makeTransitLandRequest(string $endpoint): string {
        $transitLandUrl = "https://transit.land/api/v1/$endpoint";
        $ch = curl_init($transitLandUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        //curl_setopt($ch, CURLOPT_VERBOSE, 1);

        $response = curl_exec($ch);
        curl_close($ch);

        return $response;
    }
}

if (php_sapi_name() !== 'cli')
    print(TransitManager::processRequest());
