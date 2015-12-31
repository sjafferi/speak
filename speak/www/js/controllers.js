angular.module('starter.controllers', [])


.controller('RecordCtrl', ['$scope', '$timeout', '$ionicPlatform', '$cordovaMedia', 'GUID', '$cordovaFile', '$cordovaFileTransfer', function($scope, $timeout, $ionicPlatform, $cordovaMedia, GUID, $cordovaFile, $cordovaFileTransfer) {
	var seconds = 0; var minutes = 0; var hours = 0; var t; $scope.textContent = "00:00:00";
	$scope.recordingNum = 0; //NUMBER OF RECORDINGS IN ONE LECTURE
	$scope.cordova = new Object();
	var recordingID = GUID.get()
	var mediaVar = null;
	$scope.recordFileNames = [];
	//PROBELMS CURRENTLY:
		//1. PRESSING RECORD WHEN PLAYING -> DOESNT STOP PLAYING COMPLETELY. DOESNT RECORD.
		//2. PRESSING PLAY WHEN PLAYING -> OVERLAP PLAYS
		//3.
		// SOLUTION TO THIS: CREATE A STOP FUNCTION TO THE PLAY THAT STOPS ALL AUDIO THAT IS SUPPOSED TO PLAY
		//3. PRESSING PLAY WHEN RECORDING -> DOESNT STOP TIMER
		//
	function stop() {
		if ($scope.status == 'recording') {
			mediaVar.stopRecord();
			log("Recording stopped");
		}
		else if ($scope.status == 'playing') {
			mediaVar.stop();
			log("Play stopped");
		}
		else {
			log("Nothing stopped");
		}
		$scope.status = 'stopped';
	}
	function record() {
		if ($scope.status == 'playing') stop();
		if (mediaVar != null) {
			$scope.recordingNum++;
			mediaVar.release();
			mediaVar = null;
		}
		$scope.recordFileNames.push(recordingID+"-"+$scope.recordingNum+".wav");
		createMedia(function() {
			$scope.status = "recording";
			mediaVar.startRecord();
		}, onStatusChange);
	}
	$scope.playback = function() {
		stop();
		function playMedia(index){
			return createMedia(
				function(){
					$scope.status = "playing";
					mediaVar.play().then(function(index){
						return function(){
							console.log(index);
							//ADD CONDITION HERE THAT WILL STOP PLAYING
							if (index != $scope.recordingNum) playMedia(index+1);
							else $scope.status = "stopped";
						};
					}(index));
				},
				null,
				index
			);
		}
		playMedia(0);
		/*for (var i = 0; i < $scope.recordFileNames.length; i++) {
			playMedia(i);
		}*/
	}
	function createMedia(onMediaCreated, mediaStatusCallback, index, success) {
		if (typeof success === 'undefined') success = function(){	log("Media created successfully"); };
		if (typeof mediaStatusCallback == 'undefined') mediaStatusCallback = null;
		if (typeof index === 'undefined') index = $scope.recordingNum;
		mediaVar = $cordovaMedia.newMedia(cordova.file.externalApplicationStorageDirectory + $scope.recordFileNames[index], success, onError, mediaStatusCallback);
		onMediaCreated();
	}
	$scope.clear = function() {
		stop();
		var count = 0;
		$scope.status = "deleting";
		//DELETE ALL FILES, RESET VARIABLES
		for (var i = 0; i < $scope.recordFileNames.length; i++) {
			$cordovaFile.removeFile(cordova.file.externalApplicationStorageDirectory, $scope.recordFileNames[i])
			.then(function (result) {
				console.log('Success: deleting audio file' + JSON.stringify(result));
				count++;
				if (count === $scope.recordFileNames.length) {
					$scope.recordFileNames.length = 0;
					count = 0;
					$scope.textContent = "00:00:00";
					seconds = 0; minutes = 0; hours = 0;
					mediaVar = null;
					$scope.recordingNum = 0;
					$scope.status = "stopped";
				}
			}, function (err) {
				console.log('Error: deleting audio file' + JSON.stringify(err));
			});
		}
	}
	$scope.save = function(){
		stop();
		//SEND FILES TO SERVER
		//CREATE NEW ID
		var count = 0;
		$scope.status = "saving";
		function send(index) {
			var fileName =  $scope.recordFileNames[index];
			var options = {fileName: fileName, mimeType: 'audio/wav', params: {lectureid: recordingID, current: index, total: $scope.recordingNum}};
			console.log(options);
			$cordovaFileTransfer.upload('http://40.76.12.52:8080', cordova.file.externalApplicationStorageDirectory + fileName, options)
			.then(function(result) {
				console.log(result)
				count++;
				if (count === $scope.recordFileNames.length) {
					$scope.status = "stopped";
				}
				// Success!
			}, function(err) {
				console.log(err)
				count++;
				if (count === $scope.recordFileNames.length) {
					$scope.status = "stopped";
				}
				// Error
			}, function (progress) {
				console.log(progress)
				count++;
				if (count === $scope.recordFileNames.length) {
					$scope.status = "stopped";
				}
				// constant progress updates
			});
		}
		for (var i = 0; i < $scope.recordFileNames.length; i++){
			send(i);
		}
	}
	function playAudio(url) {
		// Play the audio file at url
		var my_media = new Media(url,
			// success callback
			function () {
				console.log("playAudio():Audio Success");
			},
			// error callback
			function (err) {
				console.log("playAudio():Audio Error: " + err);
			}
		);
		// Play audio
		my_media.play();
	}
	$scope.toggleRecord = function() {
		if ($scope.recording){
			$timeout.cancel(t);
			stop();
		} else {
			timer();
			$scope.status = 'recording';
			record();
		}
		$scope.recording = !$scope.recording;
	}
	function onStatusChange(){}
	function onSuccess(){}
	function onError(err) {
		console.log(err);
		if (typeof err.message != 'undefined')
		err = err.message;
		alert("Error : " + err);
	}
	function log(message) {
		console.info(message);
	}
	function add() {
		seconds++;
		if (seconds >= 60) {
			seconds = 0;
			minutes++;
			if (minutes >= 60) {
				minutes = 0;
				hours++;
			}
		}
		$scope.textContent = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
		timer();
	}
	function timer() {
		t = $timeout(add, 1000);
	}
	$scope.safeApply = function(fn) {
		var phase = this.$root.$$phase;
		if(phase == '$apply' || phase == '$digest') {
			if(fn && (typeof(fn) === 'function')) {
				fn();
			}
		} else {
			this.$apply(fn);
		}
	};
	$ionicPlatform.ready(function() {
		$scope.safeApply(function() {
			$scope.cordova.loaded = true;
		});
	});
}])

.controller('ClassesCtrl', function($scope) {
	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//
	//$scope.$on('$ionicView.enter', function(e) {
	//});
	/*
	$scope.chats = Chats.all();
	$scope.remove = function(chat) {
	Chats.remove(chat);
};*/
})
/*
.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
$scope.chat = Chats.get($stateParams.chatId);
})
*/
.controller('AccountCtrl', function($scope) {
	$scope.settings = {
		enableFriends: true
	};
});
