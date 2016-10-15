<?php
//TODO: refactor to use PHPUnit

namespace transit_webApp;

use Exception;
use PDO;
use transit_webApp\models\LatitudeLongitude;
use transit_webApp\exceptions\NoResultsException;
use transit_webApp\models\Stop;

require_once '../services/DatabaseAccessLayer.php';

define('CONFIG_INI', '../services/config.ini');

/**
 * For testing the database setup and databaseAccessLayer
 */
function main() {
    if (php_sapi_name( ) !== 'cli')                         //only run from the command line
        die();

    testAll();
}

function testAll() {

    set_error_handler('\transit_webApp\warning_handler');   //manually handle warnings
    DatabaseAccessLayer::setTestMode(true);

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
    echo("testing existence of tables...\n");
    $dbh = DatabaseAccessLayer::getDatabaseConnection();
    $config = parse_ini_file(CONFIG_INI, true);
    testRequiredTables($dbh, $config);
    testConditionalTables($dbh, $config);
}

function testRequiredTables(PDO $dbh, array $config){
    $tables = $config['required_tables']['tables'];

    foreach ($tables as $table)
        testTable($dbh, $table, true);
}

function testConditionalTables(PDO $dbh, array $config){
    $settingKeys = $config['conditional_tables']['table_keys'];

    foreach($settingKeys as $settingKey) {
        $testIt = strtolower($config['general'][$settingKey] == 'true');
        testConditionalTable($dbh, $config, $settingKey, $testIt);
    }
}

function testConditionalTable(PDO $dbh, array $config, $settingKey, $testIt){
    $table_name = $config['conditional_tables']['table_name'][$settingKey];
    testTable($dbh, $table_name, $testIt);
}

function testTable(PDO $dbh, string $table_name, bool $testIt){
    echo("   table \"$table_name\":");
    $tabs = strlen($table_name) > 10 ? "\t" : "\t\t";
    if (!$testIt) {
        echo($tabs . "SKIPPED\n");
        return;
    }

    $results = $dbh->query("SELECT * FROM $table_name");

    if ($results === False)
        throw new Exception("Table missing: $table_name");
    else
        echo($tabs . "EXISTS\n");
}

/**
 * Test that the prepared statements exist
 */
function testPreparedStatements() {

    echo("testing prepared statements...\n");

    testProxySetup();

    echo("   testing GETROUTEID... ");
    try {
        DatabaseAccessLayer::convert_lineDirId(53210);
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");

    echo("   testing GETLINEDIRID...");
    try {
        DatabaseAccessLayer::convert_route_onestop_id('r-c2krpu-1');
    } catch  (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\tPASSED\n");

    echo("   testing UPDATEROUTEID...");
    DatabaseAccessLayer::updateRouteId("r-asdfgh-00", "12345", "00", "TESTING");
    $dbo = DatabaseAccessLayer::getDatabaseConnection();
    $dbo->query("DELETE FROM route_ids WHERE route_onestop_id='r-asdfgh-00';");
    echo("\t\tPASSED\n");

    echo("   testing GETROUTEGEOMETRYBYLINEDIRID...");
    try {
        DatabaseAccessLayer::getRouteGeometryByLineDirId("53210");
    } catch (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\t\tPASSED\n");

    echo("   testing GETSTOPSWITHINRADIUS...");
    try {
        $result = DatabaseAccessLayer::getStopsWithinRadius(new LatitudeLongitude("45", "90"), 0);
        if (gettype($result) != "array" && !$result)
            throw new NoResultsException("FAILED");
    } catch (NoResultsException $nex) {
        $msg = $nex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\t\tPASSED\n");

    $stop = '{
        "stopId": 2205,
        "abbr": "SCC",
        "name": "Spokane Community College",
        "ivrNum": "3204",
        "pictureFilePath": "",
        "point": {
            "lon": -117.3626,
            "lat": 47.675956
        },
        "stopType": "N",
        "lineDirs": [
            {
                "lineDirId": 52640
            },
            {
                "lineDirId": 52640
            }
        ]
    }';

    echo("   testing UPDATESTOP...");
    try {
        DatabaseAccessLayer::updateStop(Stop::buildStopsFromDecodedJson(json_decode($stop, true))[0]);
    } catch (Exception $ex) {
        $msg = $ex->getMessage();
        echo("\twarning: $msg\n\t\t\t");
    }
    echo("\t\tPASSED\n");

}

function testProxySetup(){
    $useProxies = parse_ini_file(CONFIG_INI, true)['general']['use_proxies'];
    if (strtolower($useProxies) === 'false') {
        echo("   proxy tests disabled; \tSKIPPED\n");
        return;
    }

    echo("   testing GETNUMBEROFPROXIES...");
    $numProxies = DatabaseAccessLayer::getNumberOfProxies();
    echo("$numProxies\n");
    if ($numProxies == 0)
        throw new Exception("Table \"proxies\" needs 2+ proxies to continue testing");

    echo("   testing GETPROXYBYID...");
    $proxy = DatabaseAccessLayer::getNextProxy();
    echo("\t$proxy\n");
}

/**
 * Convert warnings into exceptions
 */
function warning_handler(int $errno, string $errstr, string $errfile, int $errline) {
    throw new Exception("Error on line $errline of file $errfile:\n\t$errstr");
}

main();