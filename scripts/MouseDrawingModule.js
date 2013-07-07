/*
 * Bing Maps Path Drawing Module
 *
 * Copyright (c) 2013      KJRB
 * Released under the MIT License
 */

function PathDrawing(map) {
    var MME = Microsoft.Maps.Events, MM = Microsoft.Maps,
        exports = {},
        isDrawing = false,
        mapDiv,
        canvas,
        oldCursor = map.getRootElement().style.cursor,
        canvasContext,
        mouseDownHandler,
        mouseUpHandler,
        mouseMoveHandler,
        viewChangeStartHandler,
        viewChangeEndHandler,
        locations = [],
        line,
        allLines = new Microsoft.Maps.EntityCollection(),
        drawingOptions,
        options = [],
        offsetX, offsetY,
        strokeColor = new MM.Color(255, 0, 0, 255),
        strokeThickness = 2,
        strokeStyle = "rgba(255, 255, 0, 0.5)";

    function init() {

        mapDiv = map.getRootElement();
        offsetX = mapDiv.offsetParent.offsetLeft;
        offsetY = mapDiv.offsetParent.offsetTop;

        if (mapDiv.childNodes.length >= 3 && mapDiv.childNodes[2].childNodes.length >= 2) {

            canvas = createCanvas();
            var container = createCanvasContainer(canvas);
            mapDiv.childNodes[2].childNodes[1].appendChild(container);

            viewChangeStartHandler = MME.addHandler(map, 'viewchangestart', clearCanvas);
            viewChangeEndHandler = MME.addHandler(map, 'viewchangeend', recreateCanvas);

            if (typeof FlashCanvas != "undefined") {
                FlashCanvas.initElement(canvas);
            }

            canvasContext = canvas.getContext('2d');

            map.entities.push(allLines);

            //delete init;
        } else {
            setTimeout(init, 100);
        }
    }

    function createCanvas() {
        var canvas = document.createElement('canvas');
        canvas.style.position = 'relative';
        canvas.height = map.getHeight();
        canvas.width = map.getWidth();
        canvas.style.top = -canvas.height / 2 + 'px';
        canvas.style.left = -canvas.width / 2 + 'px';
        canvas.style.display = 'none';
        return canvas;
    }

    function createCanvasContainer(canvasElement) {
        var container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '0px';
        container.style.top = '0px';
        container.appendChild(canvasElement);
        return container;
    }

    function handleMouseDown(e) {
        line = new Microsoft.Maps.EntityCollection();
        locations[locations.length] = [];
        options[options.length] = drawingOptions;
        allLines.push(line);
        mouseMoveHandler = MME.addHandler(map, 'mousemove', handleMouseMove);
        mapDiv.style.cursor = 'pointer';
        addRecord(e);
        e.handled = true;
        return true;
    }

    function handleMouseUp(e) {
        MME.removeHandler(mouseMoveHandler);
        addRecord(e);
        drawFull();
        mapDiv.style.cursor = oldCursor;
        e.handled = true;
        return true;
    }

    function handleMouseMove(e) {
        addRecord(e);
        e.handled = true;
        return true;
    }

    function addPoint(e, locationsArray) {
        var point = new Microsoft.Maps.Point(e.getX(), e.getY());
        var loc = map.tryPixelToLocation(point);
        locationsArray.push(loc);
    }

    function drawLine(locationsArray, lineLayer, lineColor) {
        lineLayer.clear();
        lineLayer.push(new Microsoft.Maps.Polyline(locationsArray, {strokeColor: lineColor, strokeThickness: strokeThickness } ));
    }

    function drawOnCanvas3(x, y) {
        canvasContext.lineTo(x, y);
    }

    function addRecord(e) {
        var locs = locations[locations.length - 1], lineColor = options[options.length - 1].lineColor;

        addPoint(e, locs);

        drawLine(locs, line, lineColor);
    }

    function drawFull(index) {
        var locationsIndex = index !== undefined ? index : locations.length - 1,
            metersPerPixel = map.getMetersPerPixel();
        var locs = locations[locationsIndex];
        var opt = options[locationsIndex];
        canvasContext.lineWidth = Math.round(opt.pathWidth * 1000 / metersPerPixel);
        canvasContext.lineCap = 'round';
        canvasContext.strokeStyle = opt.pathColor;
        canvasContext.lineJoin = "round";

        for (var i = 0; i < locs.length; i++) {

            var p = map.tryLocationToPixel(locs[i], Microsoft.Maps.PixelReference.page);
            var dx = Math.round(p.x) - p.x > 0 ? 1 : 0;
            var dy = Math.round(p.y) - p.y > 0 ? 1 : 0;
            dx += 1;
            dy += 1;
            var x = Math.round(p.x) - offsetX - dx;
            var y = Math.round(p.y) - offsetY - dy;
            if (i == 0) {
                canvasContext.beginPath();
                canvasContext.moveTo(x, y);
            }
            else {
                drawOnCanvas3(x, y);
            }
        }
        canvasContext.stroke();
    }

    function clearCanvas() {
        canvas.width = canvas.width;
    }

    function recreateCanvas() {
        for (var i = 0; i < locations.length; i++)
        {
            drawFull(i);
        }
    }

    exports.setIsDrawing = function () {
        isDrawing = !isDrawing;

        if (!canvas) {
            init();
            show();
        }

        if (isDrawing) {
            mouseDownHandler = MME.addHandler(map, 'mousedown', handleMouseDown);
            mouseUpHandler = MME.addHandler(map, 'mouseup', handleMouseUp);
        }
        else {
            MME.removeHandler(mouseDownHandler);
            MME.removeHandler(mouseUpHandler);
        }
    };

    function show() {
        if (canvas) {
            canvas.style.display = '';
        }
    }

    function hide() {
        if (canvas) {
            canvas.style.display = 'none';
        }
    }

    function CreateMMColor(c) {
       var parts = c.split(',');
       return new MM.Color(255, parts[0], parts[1], parts[2]);
    }

    exports.setDrawingOptions = function (val) {
        val.pathColor = val.pathColor ? "rgba(" + val.pathColor + ",0.5)" : strokeStyle;
        val.lineColor = val.lineColor ? CreateMMColor(val.lineColor) : strokeColor;
        drawingOptions = val;
    };

    return { toggleDrawing: exports.setIsDrawing, setDrawingOptions: exports.setDrawingOptions };

}

Microsoft.Maps.moduleLoaded('PathDrawingModule');



