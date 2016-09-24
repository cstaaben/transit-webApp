-- phpMyAdmin SQL Dump
-- version 4.5.1
-- http://www.phpmyadmin.net
--
-- Host: 127.0.0.1
-- Generation Time: Sep 22, 2016 at 04:07 AM
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `GETLINEDIRID` (IN `r_id` VARCHAR(100) CHARSET ascii)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'For translating route_onestop_ids to lineDirIds'
SELECT dirName, lineDirId 
FROM route_ids 
WHERE route_onestop_id = r_id
ORDER BY lineDirId$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GETNUMBEROFPROXIES` ()  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Gets the number of proxies'
SELECT COUNT(address) FROM proxies$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GETPROXYBYID` (IN `byId` INT UNSIGNED)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Gets proxy by id'
SELECT address FROM proxies WHERE id=byId$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `GETROUTEID` (IN `fromLineDirId` INT UNSIGNED)  READS SQL DATA
    DETERMINISTIC
    SQL SECURITY INVOKER
    COMMENT 'Get route_onestop_id from lineDirId'
SELECT route_onestop_id FROM route_ids WHERE lineDirId=fromLineDirId$$

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

CREATE TABLE `proxies` (
  `id` int(10) UNSIGNED NOT NULL COMMENT 'Must be contiguous',
  `address` varchar(15) NOT NULL COMMENT 'IPv4 address'
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

-- --------------------------------------------------------

--
-- Table structure for table `route_ids`
--

CREATE TABLE `route_ids` (
  `id` int(10) UNSIGNED NOT NULL,
  `route_onestop_id` varchar(100) NOT NULL COMMENT 'transit.land''s route id',
  `lineDirId` int(10) UNSIGNED NOT NULL COMMENT 'STA''s route id behind the scenes',
  `routeNum` int(10) UNSIGNED NOT NULL COMMENT 'STA''s route number',
  `dirName` varchar(50) NOT NULL COMMENT 'From STA''s GetListOfLines dirName property'
) ENGINE=InnoDB DEFAULT CHARSET=ascii COMMENT='For mapping ids used by transit.land to those used by STA';

--
-- Indexes for dumped tables
--

--
-- Indexes for table `proxies`
--
ALTER TABLE `proxies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `address` (`address`),
  ADD KEY `id_2` (`id`);

--
-- Indexes for table `route_ids`
--
ALTER TABLE `route_ids`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lineDirId` (`lineDirId`),
  ADD UNIQUE KEY `id` (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `proxies`
--
ALTER TABLE `proxies`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Must be contiguous';
--
-- AUTO_INCREMENT for table `route_ids`
--
ALTER TABLE `route_ids`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
