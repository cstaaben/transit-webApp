<?php

namespace transit_webApp;

use PDO;
use PDOException;

require_once 'NoResultsException.php';

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
        return self::queryParameterless($query)[0];
    }

    static function getRouteGeometryByLineDirId(int $lineDirId) : string {
        $clean_id = self::sanitizeInt($lineDirId);
        $query = 'CALL `GETROUTEGEOMETRYBYLINEDIRID`(:id)';

        $result = self::queryById($clean_id, $query, PDO::PARAM_STR);
        return $result[0]['route_geometry'];
    }

    /**
     * @param string $excludeProxy don't return this proxy
     * @return string a new proxy
     */
    static function getNextProxy(string $excludeProxy="") : string {
        $oldId = -1;
        $numProxies = self::getNumberOfProxies();
        do {
            $newId = self::getRandomInt(1, $numProxies+1, $oldId);
            $proxy = self::getProxyById($newId);
        } while($excludeProxy == $proxy);
        return $proxy;
    }

    static function getProxyById(int $id) : string {
        $clean_id = self::sanitizeInt($id);
        $query = 'CALL `GETPROXYBYID`(:id);';

        return self::queryById($clean_id, $query, PDO::PARAM_INT);
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

        $result = $statement->fetch();
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

    //endregion

    static function getRandomInt(int $min, int $max, int $exclude=NAN) : int {
        if ($min >= $max)
            throw new \Exception("min must be strictly less than max");

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