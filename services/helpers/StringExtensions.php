<?php

namespace transit_webApp\helpers;

class StringExtensions {
    public static function formatArrayToJsonObject(array $array) : string {
        $json = "{";
        for ($i = 0; $i < count($array); $i++){
            $json .= $array[$i];
            if ($i < count($array)-1)
                $json .= ',';
        }
        $json .= '}';
        return $json;
    }
}