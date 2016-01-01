// example for initializing events without jQuery
// will be exchanged for jQuery and oop style soon
(function init(){
	document.addEventListener('DOMContentLoaded', function() {
		var closeBtns = document.querySelectorAll('[data-action="close-window"]');
		for (var i = 0; i < closeBtns.length; i++) {
			var obj = closeBtns[i];
			obj.addEventListener('click', function(){closeWindow()});
		}

		var dragResizeHandles = document.querySelectorAll('[data-action="dragResize-window"]');
		for (var j = 0; j < dragResizeHandles.length; j++) {
			var obj1 = dragResizeHandles[j];
			obj1.addEventListener('mousedown', function () {
				dragResize('BottomRight');
			});
		}

		var dragMoveHandles = document.querySelectorAll('[data-action="dragMove-window"]');
		for (var k = 0; k < dragMoveHandles.length; k++) {
			var obj2 = dragMoveHandles[k];
			obj2.addEventListener('mousedown', function(){dragMove()});
		}
	}, false)
})();

function dragResize(edge){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.dragResize(result.window.id, edge);
		}
	});
}

function dragMove(){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.dragMove(result.window.id);
		}
	});
}

function closeWindow(){
	overwolf.windows.getCurrentWindow(function(result){
		if (result.status=="success"){
			overwolf.windows.close(result.window.id);
		}
	});
}