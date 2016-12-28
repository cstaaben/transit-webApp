<?php

namespace transit_webApp\requests;

require_once dirname(__FILE__) . '/AClientRequestMethod.php';
require_once dirname(__FILE__) . '/IClientRequestMethod.php';

class InvalidClientRequestMethod extends AClientRequestMethod implements IClientRequestMethod {

    const METHOD_NAME = 'invalid';
    const ERROR_MESSAGE = 'invalid request method';
    const RESPONSE_CODE = 400;

    public function __construct(string $errorMessage = self::ERROR_MESSAGE,
                                int $httpResponseCode = self::RESPONSE_CODE){
        $this->errorMessage = $errorMessage;
        $this->httpResponseCode = $httpResponseCode;
    }

    public static function getMethodName(): string {
        return self::METHOD_NAME;
    }

    public function executeMethod(): string {
        return $this->errorMessage;
    }
}