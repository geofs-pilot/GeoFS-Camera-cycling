// ==UserScript==
// @name         GeoFS Camera Cycling
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Cycle through all camera angles except 2, 3, 4, 5 every 30 seconds in a random order
// @match        https://www.geo-fs.com/geofs.php?v=*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let cycleInterval = 30000;
    let cameraList = [];
    let currentIndex = 0;
    let cameraInterval = null;
    let currentAircraftId = null;
    globalThis.cycling = false;

    function buildCameraList() {
        const excluded = [2, 3, 4, 5];
        cameraList = geofs.camera.modes
            .map((_, i) => i)
            .filter(i => !excluded.includes(i));

        // Shuffle
        for (let i = cameraList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cameraList[i], cameraList[j]] = [cameraList[j], cameraList[i]];
        }

        currentIndex = 0;
    }

    function startCycling() {
        if (!geofs.camera || !geofs.camera.modes) return;
        if (cameraInterval) clearInterval(cameraInterval);
        buildCameraList();
        cameraInterval = setInterval(() => {
            if (!geofs.pause && cycling && cameraList.length > 0) {
                geofs.camera.set(cameraList[currentIndex]);
                console.log("Switched to camera:", cameraList[currentIndex]);
                currentIndex = (currentIndex + 1) % cameraList.length;
            }
        }, cycleInterval);
    }

    function stopCycling() {
        cycling = false;
        if (cameraInterval) clearInterval(cameraInterval);
    }

    function toggleCycling() {
        cycling = !cycling;
        if (cycling) {
            ui.notification.show("Camera cycling started.");
            console.log("Camera cycling started.");
            startCycling();
        } else {
            stopCycling();
            ui.notification.show("Camera cycling stopped.");
            console.log("Camera cycling stopped.");
        }
    }

    function monitorAircraftChange() {
        setInterval(() => {
            if (geofs.aircraft && geofs.aircraft.instance) {
                let id = geofs.aircraft.instance.id;
                if (id !== currentAircraftId) {
                    currentAircraftId = id;
                    console.log("Stopped cycling due to aircraft change");
                    stopCycling();
                }
            }
        }, 1000);
    }

    function init() {
        const wait = setInterval(() => {
            if (geofs?.camera?.modes && geofs?.aircraft?.instance) {
                clearInterval(wait);
                currentAircraftId = geofs.aircraft.instance.id;
                monitorAircraftChange();
                document.addEventListener("keydown", function (event) {
                    if (event.key.toLowerCase() === "w"  && !event.ctrlKey && !event.altKey && !event.metaKey) {
                        toggleCycling();
                    }
                });
                console.log("Script running. Press 'W' to toggle.");
            }
        }, 500);
    }

    init();
})();

