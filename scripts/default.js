"use strict";

(function () {

function execute(e) {
    preStart();
    var start = new Date().getTime();
    calculate(e);
    var end = new Date().getTime();
    var time = end - start;
    afterStop(time, e);
}

function withWebWorker() {
    preStart();
    var start = new Date().getTime();
    calculate(true);
    var end = new Date().getTime();
    var time = end - start;
    afterStop(time, true);
}

function preStart() {
  $("#resultBox").hide();
  $("#withWW").hide();
  $("#withoutWW").hide()
//   $("#progressbar").show(500);
}

function afterStop(spentTime, mode) {
  $("#timespent").html(spentTime + "ms");
  $("#progressbar").hide(0, function() {
    mode ? $("#withWW").show() : $("#withoutWW").show();
    $("#resultBox").show(200);
  });
}
    var mode = true;
    var source = document.getElementById("source");
$('#photo').change(function(){ 
    var value = $(this).val();
    source.src = value;
});
    $("#with").click(function () {
       execute(true); 
      });
    
    $("#without").click(function () {
        execute(false);
      });

    function calculate (e) {
        var canvas = document.getElementById("target");
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;

        if (!canvas.getContext) {
            log.innerHTML = "Canvas not supported. Please install a HTML5 compatible browser.";
            return;
        }

        var tempContext = canvas.getContext("2d");
        var len = canvas.width * canvas.height * 4;

        tempContext.drawImage(source, 0, 0, canvas.width, canvas.height);

        if (!e) {

            var canvasData = tempContext.getImageData(0, 0, canvas.width, canvas.height);
            var binaryData = canvasData.data;
            processSepia(binaryData, len);

            tempContext.putImageData(canvasData, 0, 0);

            return;
        }

        var workersCount = 4;
        var finished = 0;
        var segmentLength = len / workersCount;
        var blockSize = canvas.height / workersCount;

        var onWorkEnded = function (e) {
            var canvasData = e.data.result;
            var index = e.data.index;
            tempContext.putImageData(canvasData, 0, blockSize * index);
            finished++;
        };

        for (var index = 0; index < workersCount; index++) {
            var worker = new Worker("scripts/pictureProcessor.js");
            worker.onmessage = onWorkEnded;
            var canvasData = tempContext.getImageData(0, blockSize * index, canvas.width, blockSize);
            worker.postMessage({ data: canvasData, index: index, length: segmentLength });
        }
    };
    source.src = "photos/small.jpg";
})();