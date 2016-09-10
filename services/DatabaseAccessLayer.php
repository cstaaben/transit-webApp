<?php

namespace transit_webApp;

use PDO;
use PDOException;

require_once 'NoResultsException.php';


/**
 * An instance of the Repository pattern; a single point of communication for interacting with the database
 */
class DatabaseAccessLayer {
    private static $db_username, $db_password;

    static function getDatabaseConnection() {
        try {
            self::loadCredentials();
            return new PDO('mysql:host=localhost;dbname=sta_webapp', self::$db_username, self::$db_password);
        } catch (PDOException $exception) {
            print("Database error: " . $exception->getMessage() . "\n");
            http_response_code(500);
            die();
        }
    }

    static function convert_route_onestop_id(string $route_onestop_id) {
        $clean_id = self::sanitizeStr($route_onestop_id);
        $query = 'CALL `GETLINEDIRID`(:id);';

        return self::convert_id($clean_id, $query, PDO::PARAM_INT);
    }

    static function convert_lineDirId(int $lineDirId) {
        $clean_id = self::sanitizeInt($lineDirId);
        $query = 'CALL `GETROUTEID`(:id);';

        return self::convert_id($clean_id, $query, PDO::PARAM_STR);
    }

    static function convert_id($id, $query, $type) {
        $pdo = self::getDatabaseConnection();

        $statement = $pdo->prepare($query, [PDO::ATTR_CURSOR => PDO::CURSOR_FWDONLY]);
        $statement->bindValue(':id', $id, $type);
        $statement->execute();

        $result = $statement->fetch(PDO::FETCH_ASSOC);
        if ($result == false)
            throw new NoResultsException("result not found for id $id");
        return $result;
    }

    static function sanitizeInt(int $int) {
        return filter_var($int, FILTER_SANITIZE_NUMBER_INT);
    }

    static function sanitizeStr(string $str) {
        return filter_var($str, FILTER_SANITIZE_STRING, FILTER_FLAG_ENCODE_AMP | FILTER_FLAG_ENCODE_LOW | FILTER_FLAG_ENCODE_HIGH);
    }

    private static function loadCredentials() {
        $config = parse_ini_file('creds.ini');
        self::$db_username = $config['db_username'];
        self::$db_password = $config['db_password'];
    }
}