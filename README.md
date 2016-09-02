# transit-webApp
##### _An improved [spokanetransit.com](https://www.spokanetransit.com/)_

### Setup:
1. Get two browser API key from [console.developers.google.com](https://console.developers.google.com)
2. Configure one key to only accept requests from your domain
3. Create a file in the _js_ directory called _apiKey.js_ containing the two variables:


    var API_KEY = '(YOUR API KEY WITH REFERER RESTRICTIONS)';
    var API_KEY_UNRESTRICTED = '(YOUR API KEY WITHOUT REFERER RESTRICTIONS)';
    
4. enable the following APIs:
    + Google Maps Javascript API
    + Google Maps Directions API
    + Google Maps Geocoding API


If it doesn't work and you get error messages in the console, you may just need to wait a few minutes for your settings to propagate.

Note that the Geocoding API won't accept keys with referer restrictions, hence the need for two keys. 