-- phpMyAdmin SQL Dump
-- version 4.6.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 01, 2016 at 05:47 PM
-- Server version: 10.1.13-MariaDB
-- PHP Version: 7.0.8

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `transit_webapp`
--

DELIMITER $$
--
-- Procedures
--
DROP PROCEDURE IF EXISTS `GETLINEDIRID`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETLINEDIRID` (IN `r_id` VARCHAR(100) CHARSET ascii)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'For translating route_onestop_ids to lineDirIds'
SELECT dirName, lineDirId
FROM route_ids
WHERE route_onestop_id = r_id
ORDER BY lineDirId$$

DROP PROCEDURE IF EXISTS `GETNUMBEROFPROXIES`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETNUMBEROFPROXIES` ()  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Gets the number of proxies'
SELECT COUNT(address) FROM proxies$$

DROP PROCEDURE IF EXISTS `GETPROXYBYID`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETPROXYBYID` (IN `byId` INT UNSIGNED)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Gets proxy by id'
SELECT address FROM proxies WHERE id=byId$$

DROP PROCEDURE IF EXISTS `GETROUTEGEOMETRYBYLINEDIRID`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETROUTEGEOMETRYBYLINEDIRID` (IN `id` INT)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'For getting the geometry associated with a lineDirId'
SELECT route_geometry FROM `route_geometry` JOIN `route_ids`USING (lineDirId) WHERE lineDirId = id$$

DROP PROCEDURE IF EXISTS `GETROUTEID`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETROUTEID` (IN `fromLineDirId` INT UNSIGNED)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Get route_onestop_id from lineDirId'
SELECT route_onestop_id FROM route_ids WHERE lineDirId=fromLineDirId$$

DROP PROCEDURE IF EXISTS `UPDATEROUTEID`$$
CREATE DEFINER=`root`@`localhost` PROCEDURE `UPDATEROUTEID` (IN `r_id` VARCHAR(10000) CHARSET ascii, IN `ldi` INT UNSIGNED, IN `routeNo` INT UNSIGNED, IN `dirNom` VARCHAR(100) CHARSET ascii)  MODIFIES SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'For adding/updating route ids'
INSERT INTO route_ids (route_onestop_id, lineDirId, routeNum, dirName)
VALUES (r_id, ldi, routeNo, dirNom)
ON DUPLICATE KEY UPDATE route_onestop_id=r_id, lineDirId=ldi, routeNum=routeNo, dirName=dirNom$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `proxies`
--

DROP TABLE IF EXISTS `proxies`;
CREATE TABLE IF NOT EXISTS `proxies` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Must be contiguous',
  `address` varchar(15) NOT NULL COMMENT 'IPv4 address',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `address` (`address`),
  KEY `id_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- --------------------------------------------------------

--
-- Table structure for table `route_geometry`
--

DROP TABLE IF EXISTS `route_geometry`;
CREATE TABLE IF NOT EXISTS `route_geometry` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `lineDirId` int(6) UNSIGNED NOT NULL,
  `route_geometry` text NOT NULL COMMENT 'the geometry returned by STA''s GetLineTrace',
  PRIMARY KEY (`id`),
  UNIQUE KEY `lineDirId` (`lineDirId`),
  UNIQUE KEY `id` (`id`),
  UNIQUE KEY `lineDirId_2` (`lineDirId`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='maps lineDirIds to route geometries';

-- --------------------------------------------------------

--
-- Table structure for table `route_ids`
--

DROP TABLE IF EXISTS `route_ids`;
CREATE TABLE IF NOT EXISTS `route_ids` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_onestop_id` varchar(100) NOT NULL COMMENT 'transit.land''s route id',
  `lineDirId` int(10) UNSIGNED NOT NULL COMMENT 'STA''s route id behind the scenes',
  `routeNum` int(10) UNSIGNED NOT NULL COMMENT 'STA''s route number',
  `dirName` varchar(50) NOT NULL COMMENT 'From STA''s GetListOfLines dirName property',
  PRIMARY KEY (`id`),
  UNIQUE KEY `lineDirId` (`lineDirId`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='For mapping ids used by transit.land to those used by STA';

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
