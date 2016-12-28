<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/AClientRequestMethod.php';

abstract class APostClientRequestMethod extends AClientRequestMethod {

    protected function getParamsFromPost() {
        $post = json_decode(file_get_contents('php://input'), true);
        if (!array_key_exists('params', $post)){
            $this->hasError = true;
            $this->errorMessage = 'missing params';
            $this->httpResponseCode = 400;
        }
        return $post['params'];
    }
}