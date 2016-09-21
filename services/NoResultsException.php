<?php

namespace transit_webApp;

/**
 * To be thrown when a database call returns no results
 */
class NoResultsException extends \Exception {
    public function __construct(string $message, $code = 0, \Exception $previous = null) {
        parent::__construct($message, $code, $previous);
    }

    public function __toString() {
        return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
    }
}