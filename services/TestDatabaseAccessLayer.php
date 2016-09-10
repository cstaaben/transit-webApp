<?php

namespace transit_webApp;

use Exception;

require_once 'DatabaseAccessLayer.php';

define('CONFIG_FILE', 'config.ini');

/**
 * For testing the database setup and databaseAccessLayer
 */
class TestDatabaseAccessLayer {

    private static $bHasRunBefore = false;                //Don't run it multiple times

    function __construct() {
        //only run tests if testing mode is enabled
        if (!self::$bHasRunBefore && parse_ini_file(CONFIG_FILE)['test_mode'])
            self::testAll();

        self::$bHasRunBefore = true;
    }

    private static function testAll() {
        set_error_handler('self::warning_handler', E_WARNING);    //manually handle warnings

        $testMethods = [
            function () { self::testDatabaseConnection(); },
            function () { self::testDatabaseTables(); },
            function () { self::testPreparedStatements(); }
        ];

        try {
            echo("=====begin database tests=====\n");
            foreach ($testMethods as $testMethod)
                $testMethod();
            echo("=====database tests PASSED=====\n");
        } catch (Exception $exception) {
            self::fail_test($exception);
        }
    }

    private static function fail_test(Exception $exception) {
        echo("FAILED\n");
        echo("\tException: " . $exception->getMessage() . "\n");
        echo("=====database tests FAILED=====\n");
        http_response_code(500);
        die();
    }

    private static function testDatabaseConnection() {
        echo("testing database connection... ");
        DatabaseAccessLayer::getDatabaseConnection();
        echo("PASSED\n");
    }

    private static function testDatabaseTables() {
        $dbh = DatabaseAccessLayer::getDatabaseConnection();
        echo('testing existence of all necessary database tables... ');
        $tables = parse_ini_file(CONFIG_FILE)['tables'];

        foreach ($tables as $table) {
            $results = $dbh->query("SELECT * FROM $table");

            if (!$results)
                throw new Exception("Table missing: $table");
        }

        echo("PASSED\n");
    }

    /**
     * Test that the prepared statements exist
     */
    private static function testPreparedStatements() {

        echo("testing prepared statements... \n");

        echo("\ttesting GETLINEDIRID... ");
        try {
            DatabaseAccessLayer::convert_lineDirId(12345);
        } catch (NoResultsException $exception) {}
        echo("PASSED\n");

        echo("\ttesting GETROUTEID... ");
        try {
            DatabaseAccessLayer::convert_route_onestop_id('r-asdfasd-00');
        } catch (NoResultsException $exception) {}
        echo("PASSED\n");

    }

    /**
     * Convert warnings into exceptions
     */
    private static function warning_handler($errno, $errstr, $errfile, $errline) {
        throw new Exception("Error on line $errline of file $errfile:\n\t$errstr");
    }
}

new TestDatabaseAccessLayer();