<?php

namespace transit_webApp;

use PDO;
use PDOException;

require_once 'NoResultsException.php';

/**
 * An instance of the Repository pattern; a single point of communication for interacting with the database
 */
class DatabaseAccessLayer {
    private static $db_name, $db_username, $db_password;

    //region database calls
    static function getDatabaseConnection(string $credentialsFilename='creds.ini') : PDO {
        try {
            self::loadCredentials($credentialsFilename);
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

    static function convert_route_onestop_id(string $route_onestop_id) : int {
        $clean_id = self::sanitizeStr($route_onestop_id);
        $query = 'CALL `GETLINEDIRID`(:id);';

        return self::queryById($clean_id, $query, PDO::PARAM_INT);

    }

    static function convert_lineDirId(int $lineDirId) : string {
        $clean_id = self::sanitizeInt($lineDirId);
        $query = 'CALL `GETROUTEID`(:id);';

        return self::queryById($clean_id, $query, PDO::PARAM_STR);
    }

    static function getNumberOfProxies() : int {
        $query = 'CALL `GETNUMBEROFPROXIES`;';
        return self::queryParameterless($query)[0];
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

        return self::queryById($clean_id, $query, PDO::PARAM_INT);
    }

    private static function queryById($id, string $query, int $type) {
        $pdo = self::getDatabaseConnection();

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':id', $id, $type);
        $statement->execute();

        $result = $statement->fetch()[0];
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

    private static function loadCredentials(string $credentialsFilename) {
        $config = parse_ini_file($credentialsFilename);
        self::$db_name = $config['db_name'];
        self::$db_username = $config['db_username'];
        self::$db_password = $config['db_password'];
    }
}