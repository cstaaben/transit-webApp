<?php

namespace transit_webApp;

use Exception;

require_once '../services/DatabaseAccessLayer.php';

define('CONFIG_FILE', 'testing_config.ini');

/**
 * For testing the database setup and databaseAccessLayer
 */

//TODO: add flag to allow skipping proxy checks

function main() {
    if (php_sapi_name( ) !== 'cli')                         //only run from the command line
        die();

    testAll();
}

function testAll() {

    set_error_handler('\transit_webApp\warning_handler');   //manually handle warnings

    $testMethods = [
        function() { testDatabaseConnection(); },
        function() { testDatabaseTables(); },
        function() { testPreparedStatements(); }
    ];

    try {
        echo("=====begin database tests=====\n");
        foreach ($testMethods as $testMethod)
            $testMethod();
        echo("=====database tests PASSED=====\n");
    } catch (Exception $exception) {
        fail_test($exception);
    }
}

function fail_test(Exception $exception) {
    echo("\tFAILED\n");
    echo("\tException: " . $exception->getMessage() . "\n");
    echo("=====database tests FAILED=====\n");
    http_response_code(500);
    die();
}

function testDatabaseConnection() {
    echo("testing database connection...");
    DatabaseAccessLayer::getDatabaseConnection();
    echo("\tPASSED\n");
}

function testDatabaseTables() {
    $dbh = DatabaseAccessLayer::getDatabaseConnection();
    echo('testing existence of tables...');
    $tables = parse_ini_file(CONFIG_FILE)['tables'];

    foreach ($tables as $table) {
        $results = $dbh->query("SELECT * FROM $table;");

        if ($results === False)
            throw new Exception("Table missing: $table");
    }

    echo("\tPASSED\n");
}

/**
 * Test that the prepared statements exist
 */
function testPreparedStatements() {

    echo("testing prepared statements...\n");

    echo("   testing GETNUMBEROFPROXIES...");
    $numProxies = DatabaseAccessLayer::getNumberOfProxies();
    echo("$numProxies\n");
    if ($numProxies == 0)
        throw new Exception("Table \"proxies\" needs 2+ proxies to continue testing");

    echo("   testing GETPROXYBYID...");
    $proxy = DatabaseAccessLayer::getNextProxy();
    echo("\t$proxy\n");

    echo("   testing GETROUTEID... ");
    try {
        DatabaseAccessLayer::convert_lineDirId(12345);
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");

    echo("   testing GETLINEDIRID...");
    try {
        DatabaseAccessLayer::convert_route_onestop_id('r-asdfasd-00');
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");
}

/**
 * Convert warnings into exceptions
 */
function warning_handler(int $errno, string $errstr, string $errfile, int $errline) {
    throw new Exception("Error on line $errline of file $errfile:\n\t$errstr");
}

main();