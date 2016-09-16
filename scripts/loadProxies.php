<?php
/**
 * A script for backing up and loading proxies to the database
 */
namespace transit_webApp;
use PDO;

require_once('../services/DatabaseAccessLayer.php');

define('CREDS_PATH', '../services/creds.ini');

class Options {
    static $inFilename = "";
    static $outFilename = "";
    static $appendMode = false;
    static $backupMode = false;
    static $csvMode = false;
    static $verboseMode = false;
}

main();

function main(){
    validateArguments();
    loadOptions();
    backupAddresses();
    loadAddresses();
}

function validateArguments(){
    //abort if not running from command line
    if (php_sapi_name( ) !== 'cli')
        die();

    global $argc, $argv;

    if ($argc < 2)
        printUsage('missing arguments');

    if (array_key_exists('-h', $argv) || array_key_exists('--help', $argv))
        printUsage();
}

function printUsage(string $message=""){
    $usage = <<< EOF
usage: php loadProxies.php [-i INFILE] [-o OUTFILE] [-a] [-b] [-v]
optional arguments:
    -h, --help      show this help message and exit
    -i INFILE       [the file to load new proxies from]
    -o OUTFILE      [the filename to backup current proxies to before loading new ones]
    -a              [add new proxies to current ones, ignoring duplicates]
    -b              [backup only]
    -c              [csv mode]
    -v              [verbose mode]

expected INFILE format: IPv4 addresses, port number excluded, newline-delimited unless option -c is chosen
EOF;

    if (!empty($message))
        print("$message\n");
    die($usage);
}

function backupAddresses(){
    $currentProxies = getCurrentProxies();

    if (Options::$verboseMode)
        echo('backing up proxies... ');

    if (empty(Options::$outFilename))
        Options::$outFilename = "proxies_backup_" . time() . ".txt";

    file_put_contents(Options::$outFilename, implode("\n", $currentProxies));

    if (Options::$verboseMode)
        echo("DONE\n");
}

function getCurrentProxies() : array {
    $pdo = DatabaseAccessLayer::getDatabaseConnection(CREDS_PATH);
    $statement = $pdo->query('SELECT address FROM proxies;');
    $result = $statement->fetchAll(PDO::FETCH_COLUMN);
    return $result;
}

function loadAddresses(){
    if (Options::$backupMode) {
        if (Options::$verboseMode)
            echo("skipping backup\n");
        return;
    }

    if (Options::$verboseMode)
        echo('loading addresses from ' . Options::$inFilename . '... ');

    $addresses = loadAddressFile();
    $values = buildValuesFromAddresses($addresses);
    insertAddressesIntoDatabase($values);

    if (Options::$verboseMode)
        echo("DONE\n");
}

function buildValuesFromAddresses(array $addresses) : string {
    $values = "";
    foreach ($addresses as $address)
        $values .= "('$address'),";
    $values = substr($values, 0, strlen($values)-1);
    return $values;
}

function loadAddressFile() : string {
    $addresses = "";
    if (!empty(Options::$inFilename)) {
        $fin = file_get_contents(Options::$inFilename);

        if (Options::$csvMode)
            $fin = str_replace(',', "\n", $fin);    //convert CSV to Unix
        $fin = str_replace("\r\n", "\n", $fin);     //convert Windows to Unix
        $fin = str_replace("\r", "\n", $fin);       //convert OSX to Unix

        if (($col = strspn($fin, '.0123456789'."\n")) < strlen($fin))
            die('ERROR: unacceptable character "' . substr($fin, $col, 1) . '" detected');

        $addresses = explode("\n", $fin);
    }

    return $addresses;
}

function insertAddressesIntoDatabase(string $values) : \PDOStatement {
    $pdo = DatabaseAccessLayer::getDatabaseConnection(CREDS_PATH);

    if (!Options::$appendMode) {
        $statement = $pdo->query('TRUNCATE TABLE proxies;');
        if (!$statement)
            echo("ERROR: database TRUNCATE failed ");
        else if (Options::$verboseMode)
            echo ("truncated table proxies... ");
    }

    $query = "INSERT INTO proxies (address) VALUES $values ON DUPLICATE KEY UPDATE address=address;";
    $statement = $pdo->query($query);
    if ($statement === False)
        echo("ERROR: database INSERT failed ");
    return $statement;
}

function loadOptions(){
    global $argc, $argv;
    $recognizedFlags = 'ioabcdv';

    for ($i = 1; $i < $argc; $i++){
        $arg = $argv[$i];

        if ($arg[0] != '-')
            printUsage('missing options');

        if (strlen($arg) > 2 || !strchr($recognizedFlags, $arg[1]))
            printUsage("unrecognized option: $arg");

        switch ($arg){
            case '-i':
                if (strchr($argv[$i+1], '-'))
                    printUsage('missing argument: INFILE');
                Options::$inFilename = $argv[$i+1];
                ++$i;
                break;
            case '-o':
                if (strchr($argv[$i+1], '-'))
                    printUsage('missing argument: OUTFILE');
                Options::$outFilename = $argv[$i+1];
                ++$i;
                break;
            case '-a':
                Options::$appendMode = true;
                break;
            case '-b':
                Options::$backupMode = true;
                break;
            case '-c':
                Options::$csvMode = true;
                break;
            case '-v':
                Options::$verboseMode = true;
                break;
            default:
                printUsage();
        }
    }
}