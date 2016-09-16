# transit-webApp
##### _An improved [spokanetransit.com](https://www.spokanetransit.com/)_

#### API Keys Setup:
1. Get two browser API key from [console.developers.google.com](https://console.developers.google.com)
2. Configure one key to only accept requests from your domain
3. Create a file in the _transit-webPapp/js_ directory called _apiKeys.js_ containing the two variables:


    var API_KEY = '(YOUR API KEY WITH REFERER RESTRICTIONS)';
    var API_KEY_UNRESTRICTED = '(YOUR API KEY WITHOUT REFERER RESTRICTIONS)';
    
4. enable the following APIs:
    + Google Maps Javascript API
    + Google Maps Directions API
    + Google Maps Geocoding API
    + Google Places API Web Service


If it doesn't work and you get error messages in the console, you may just need to wait a few minutes for your settings to propagate.

Note that the Geocoding API won't accept keys with referer restrictions, hence the need for two keys. 

#

#### Database setup:
1. Import database.sql with phpMyAdmin
2. Create a database user with **SELECT** and **EXECUTE** privileges
3. Create a file in the _transit-webApp/services_ directory called _creds.ini_
4. Format the file like so:


    [credentials]
    db_name = "<YOUR_DATABASE_NAME_HERE>"
    db_username = "<USERNAME>"
    db_password = "<PASSWORD>"
    
5. Finally, run _php testDatabaseAccessLayer.php_ to check your setup

#

#### loadProxies.php setup:
##### _this is only required if your server can't make requests to tripplanner.spokanetransit.com_
1. Check to see if this is necessary with _python3 Proxytester.py -d_. If the request goes through, you're all set.
2. Create another user with the following privileges: **SELECT, INSERT, UPDATE, DELETE, DROP, EXECUTE**
3. Repeat steps 3 and 4 above, except this time in the _transit-webApp/scripts_ directory
4. Use ProxyTester.py to build a list of proxies that work for you
5. Use loadProxies.php to upload those proxies to the database