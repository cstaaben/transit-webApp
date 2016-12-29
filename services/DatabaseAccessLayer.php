<?php

namespace transit_webApp;

use PDO;
use PDOException;

use transit_webApp\models\LatitudeLongitude;
use transit_webApp\exceptions\NoResultsException;
use transit_webApp\models\Stop;

require_once dirname(__FILE__) . '/models/LatitudeLongitude.php';
require_once dirname(__FILE__) . '/exceptions/NoResultsException.php';
require_once dirname(__FILE__) . '/models/Stop.php';

define('CREDS_INI', 'creds.ini');

/**
 * An instance of the Repository pattern; a single point of communication for interacting with the database
 */
class DatabaseAccessLayer {
    private static $db_name, $db_username, $db_password;
    private static $testMode = false;

    //region database calls
    static function getDatabaseConnection() : PDO {
        try {
            self::loadCredentials();
            $db_name = self::$db_name;
            $pdo = new PDO("mysql:host=localhost;dbname=$db_name;", self::$db_username, self::$db_password, array(
                PDO::ATTR_PERSISTENT => true
            ));
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        } catch (PDOException $exception) {
            print("Database error: " . $exception->getMessage() . "\n");
            http_response_code(500);
            die();
        }
    }

    static function convert_route_onestop_id(string $route_onestop_id) : array {
        $clean_id = self::sanitizeStr($route_onestop_id);
        $query = 'CALL `GETLINEDIRID`(:id);';

        return self::queryById($clean_id, $query, PDO::PARAM_INT);
    }

    static function convert_lineDirId(int $lineDirId) : array {
        $clean_id = self::sanitizeInt($lineDirId);
        $query = 'CALL `GETROUTEID`(:id);';

        return self::queryById($clean_id, $query, PDO::PARAM_STR);
    }

    static function getNumberOfProxies() : int {
        $query = 'CALL `GETNUMBEROFPROXIES`;';
        return self::queryParameterless($query)[0][0];
    }

    static function getRouteGeometryByLineDirId(int $lineDirId) : string {
        $clean_id = self::sanitizeInt($lineDirId);
        $query = 'CALL `GETROUTEGEOMETRYBYLINEDIRID`(:id)';

        $result = self::queryById($clean_id, $query, PDO::PARAM_STR);
        return $result[0]['route_geometry'];
    }

    static function getDirNameByLineDirId(int $lineDirId) : string {
        $clean_id = self::sanitizeInt($lineDirId);
        $dbo = self::getDatabaseConnection();
        $query = "SELECT dirName FROM route_ids WHERE lineDirId = $clean_id;";
        $statement = $dbo->query($query);
        $dirName = $statement->fetch(PDO::FETCH_ASSOC)["dirName"];
        return $dirName;
    }

    static function getStopsWithinRadius(LatitudeLongitude $latLng, int $radius) : array {
        $query = "CALL `GETSTOPSWITHINOFFSETOFCOORDS`(:latitude_in, :longitude_in, :offset_in);";
        $offset = LatitudeLongitude::convertMetersToDegrees($radius);
        $latitude = $latLng->getLatitude();
        $longitude = $latLng->getLongitude();

        $dbo = self::getDatabaseConnection();
        $statement = $dbo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':latitude_in', $latitude);
        $statement->bindValue(':longitude_in', $longitude);
        $statement->bindValue(':offset_in', $offset);
        $statement->execute();
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        $stops = [];
        foreach ($results as $result)
            $stops[] = json_decode($result['JSON']);
        return $stops;
    }

    static function getStopsWithinBounds(LatitudeLongitude $northEast, LatitudeLongitude $southWest){
        $query = "CALL `GETSTOPSINBOUNDS`(:northBound, :eastBound, :southBound, :westBound);";
        $northBound = $northEast->getLatitude();
        $eastBound = $northEast->getLongitude();
        $southBound = $southWest->getLatitude();
        $westBound = $southWest->getLongitude();

        $dbo = self::getDatabaseConnection();
        $statement = $dbo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':northBound', $northBound);
        $statement->bindValue(':eastBound', $eastBound);
        $statement->bindValue(':southBound', $southBound);
        $statement->bindValue(':westBound', $westBound);
        $statement->execute();
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        $stops = [];
        foreach ($results as $result)
            $stops[] = json_decode($result['JSON']);
        return $stops;
    }

    /**
     * @param string $excludeProxy don't return this proxy
     * @return string a new proxy
     */
    static function getNextProxy(string $excludeProxy="") : string {
        $oldId = -1;
        $numProxies = self::getNumberOfProxies();

        do {
            $newId = self::getRandomInt(1, $numProxies, $oldId);
            $proxy = self::getProxyById($newId);
        } while($excludeProxy == $proxy);
        return $proxy;
    }

    static function getProxyById(int $id) : string {
        $clean_id = self::sanitizeInt($id);
        $query = 'CALL `GETPROXYBYID`(:id);';

        $result = self::queryById($clean_id, $query, PDO::PARAM_INT)[0];
        return $result['address'];
    }

    private static function queryById($id, string $query, int $type) {
        $pdo = self::getDatabaseConnection();

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':id', $id, $type);
        $statement->execute();

        $result = $statement->fetchAll();
        if (!$result)
            throw new NoResultsException("result not found for id $id");
        return $result;
    }

    private static function queryParameterless(string $query) {
        $pdo = self::getDatabaseConnection();

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->execute();

        $result = $statement->fetchAll();
        if (!$result)
            throw new NoResultsException("results not found");
        return $result;
    }

    static function updateRouteId(string $route_onestop_id, string $lineDirId, string $routeNum, string $dirName){
        $pdo = self::getDatabaseConnection();
        $query = "CALL `UPDATEROUTEID`(:route_id, :lineDirId, :routeNum, :dirName);";

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':route_id', $route_onestop_id);
        $statement->bindValue(':lineDirId', $lineDirId);
        $statement->bindValue(':routeNum', $routeNum);
        $statement->bindValue(':dirName', $dirName);
        $statement->execute();
    }

    static function updateStop(Stop $stop){
        $pdo = self::getDatabaseConnection();
        $query = "CALL `UPDATESTOP`(:stopId_in, :json_in, :latitude_in, :longitude_in, :lineDirId_in);";

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':stopId_in', $stop->getStopId(), PDO::PARAM_INT);
        $statement->bindValue(':json_in', $stop->getJson(), PDO::PARAM_STR);
        $statement->bindValue(':latitude_in', $stop->getLatitude());
        $statement->bindValue(':longitude_in', $stop->getLongitude());
        $statement->bindValue(':lineDirId_in', $stop->getLineDirId(), PDO::PARAM_INT);
        $statement->execute();
    }

    //endregion

    static function getRandomInt(int $min, int $max, int $exclude=null) : int {
        do {
            $newInt = rand($min, $max);
        } while ($newInt === $exclude);
        return $newInt;
    }

    private static function sanitizeInt(int $int) : int {
        return filter_var($int, FILTER_SANITIZE_NUMBER_INT);
    }

    private static function sanitizeStr(string $str) : string {
        return filter_var($str, FILTER_SANITIZE_STRING, FILTER_FLAG_ENCODE_AMP | FILTER_FLAG_ENCODE_LOW | FILTER_FLAG_ENCODE_HIGH);
    }

    private static function loadCredentials() {
        $section = "credentials";
        if (self::$testMode)
            $section = "script_credentials";

        $config = parse_ini_file(CREDS_INI, true);
        self::$db_name = $config['credentials']['db_name'];
        self::$db_username = $config[$section]['db_username'];
        self::$db_password = $config[$section]['db_password'];
    }

    static function setTestMode(bool $mode){
        self::$testMode = $mode;
    }
}