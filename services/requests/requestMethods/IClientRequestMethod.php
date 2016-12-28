<?php

namespace transit_webApp\requests;

interface IClientRequestMethod {
    public static function getMethodName() : string;
    public function executeMethod() : string;
    public function getResponseCode() : int;
}