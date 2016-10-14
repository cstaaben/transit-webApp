<?php

namespace transit_webApp\models;

class LatitudeLongitude {
    private $latitude;
    private $longitude;
    private static $METERS_PER_DEGREE_APPROXIMATE = 111111.11;

    public function __construct(string $lat, string $lng){
        $this->latitude = doubleval($lat);
        $this->longitude = doubleval($lng);

        self::validate();
    }

    private function validate(){
        if ($this->latitude < 0 || $this->latitude > 90)
            throw new \InvalidArgumentException("Latitude out of range: $this->latitude");
        if ($this->longitude < -180 || $this->longitude > 180)
            throw new \InvalidArgumentException("Longitude out of range: $this->longitude");
    }

    public function getLatitude(){
        return $this->latitude;
    }

    public function getLongitude(){
        return $this->longitude;
    }

    public static function convertMetersToDegrees($meters) : float {
        return $meters / self::$METERS_PER_DEGREE_APPROXIMATE;
    }
}