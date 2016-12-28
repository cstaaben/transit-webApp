<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/../DatabaseAccessLayer.php';

use transit_webApp\DatabaseAccessLayer;

class STA_Requester {

    public static function requestBusDataForLine(string $lineDirId) : array {
        $request = self::buildTravelPointsRequest($lineDirId);
        return self::requestRealTimeManagerData($request);
    }

    public static function requestRouteGeometry(string $lineDirId) : array {
        $request = self::buildLineTraceRequest($lineDirId);
        return self::requestInfoWebData($request);
    }


    private static function buildTravelPointsRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetTravelPoints","params":{"travelPointsReqs":[{"lineDirId":"' . $lineDirId . '","callingApp":"RMD"}],"interval":10}}';
    }

    private static function buildLineTraceRequest(string $lineDirId) : string {
        return '{"version":"1.1","method":"GetLineTrace","params":{"GetLineTraceRequest":{"LineDirId":' . $lineDirId . '}}}';
    }


    private static function requestRealTimeManagerData(string $request) : array {
        return self::makeSTARequestWithResource($request, 'RealTimeManager');
    }

    private static function requestInfoWebData(string $request) : array {
        return self::makeSTARequestWithResource($request, 'InfoWeb');
    }


    private static function makeSTARequestWithResource(string $request, string $resource) : array {
        $use_proxy = strtolower(parse_ini_file(CONFIG_INI, true)['general']['use_proxies']) == 'true';

        if ($use_proxy)
            return self::makeRequestThroughProxy($request, $resource);
        else
            return self::makeSTArequest($request, $resource);
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
}