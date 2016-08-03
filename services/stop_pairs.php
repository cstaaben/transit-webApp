<?php
	
	function getStopPairs($location) {
		
	}

	if(isset($_POST["loc"])) {
		$loc = stripslashes(htmlspecialchars(trim($_POST["loc"])));
		
		
	}
	else {
		http_response_code(406);
		echo "Missing paramter";
	}
?>