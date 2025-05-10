// ==UserScript==
// @name         GeoFS Camera Cycling
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Cycle through all camera angles except 2, 3, 4, 5 every 30 seconds in a random order
// @match        https://www.geo-fs.com/geofs.php?v=*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let cycleInterval = 30000;
    let currentAircraftId = null;
    let cameraInterval = null;
    let cameraList = [];
    let currentIndex = 0;
    let manuallyPaused;

function cycleCamera() {
    function startCameraCycle() {
        if (!geofs.camera || !geofs.camera.modes) return;

        document.addEventListener("keypress", (e) => {
            if (e.key === "w" || e.key === "W") {
                    manuallyPaused = !manuallyPaused;
                    console.log("Camera cycling manually paused:", manuallyPaused);
            }
        });
        
        const cameraModes = geofs.camera.modes;
        const excludedIndices = [2, 3, 4, 5];
        cameraList = [];

        for (let i = 0; i < cameraModes.length; i++) {
            if (!excludedIndices.includes(i)) {
                cameraList.push(i);
            }
        }

        // Shuffle the camera list
        for (let i = cameraList.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cameraList[i], cameraList[j]] = [cameraList[j], cameraList[i]];
        }

        console.log("Cycling through randomized cameras (excluding 2, 3, 4, 5):", cameraList);

        currentIndex = 0;
        if (cameraInterval) clearInterval(cameraInterval);
        cameraInterval = setInterval(() => {
            if (!geofs.pause && !manuallyPaused && cameraList.length > 0) {
                const camIndex = cameraList[currentIndex];
                geofs.camera.set(camIndex);
                console.log("Switched to camera:", camIndex);
                currentIndex = (currentIndex + 1) % cameraList.length;
            }
        }, cycleInterval);
    }

    // Monitor aircraft changes
    setInterval(() => {
        if (geofs.aircraft && geofs.aircraft.instance && geofs.aircraft.instance.id !== currentAircraftId) {
            currentAircraftId = geofs.aircraft.instance.id;
            console.log("Aircraft changed. Restarting camera script.");
            startCameraCycle();
        }
    }, 1000);


    // Initial load wait
    const waitForGeoFS = setInterval(() => {
        if (typeof geofs !== "undefined" && geofs.camera && geofs.camera.modes && geofs.aircraft && geofs.aircraft.instance) {
            clearInterval(waitForGeoFS);
            currentAircraftId = geofs.aircraft.instance.id;
            startCameraCycle();
        }
    }, 500);
};
function handleWPress (e) {
    if (e.key === "w" || e.key === "W") {
        cycleCamera();
        document.removeEventListener("keypress", handleWPress); 
    }
};
document.addEventListener("keypress", handleWPress);

})();


