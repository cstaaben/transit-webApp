<?php
/**
 * For interacting with the database
 */

function testDBConnection(){
    try {
        require_once('creds.php');

        print("pass: $db_password");
        $dbh = new PDO('mysql:host=localhost;dbname=sta_webapp', $db_username, $db_password);
        foreach ($dbh->query('SELECT * FROM route_ids') as $row) {
            print_r($row);
        }
    } catch (PDOException $ex) {
        print "Error!: " . $ex->getMessage() . "<br/>";
        die();
    }
}

testDBConnection();