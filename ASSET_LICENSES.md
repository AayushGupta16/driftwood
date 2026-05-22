# Asset Sources and Licenses

This page uses NASA-authored Earth imagery as source material. NASA content is generally not subject to copyright in the United States and may be used for factual, non-endorsement educational or informational purposes, including internet web pages. NASA should be acknowledged as the source, and NASA insignia/logotypes/identifiers are not used here.

NASA usage guidance:
- https://www.nasa.gov/nasa-brand-center/images-and-media/

## Local Assets

### `assets/nasa/black-marble-2016-3600.jpg`

- Source: NASA Earth Observatory / NASA Science, Earth at Night/Black Marble flat maps.
- File downloaded: `BlackMarble_2016_01deg.jpg`, 2016 color global 3600x1800 JPEG.
- Source page: https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
- Direct source URL: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
- Credit: NASA Earth Observatory / NASA Science.

### `assets/nasa/earth-no-clouds-2048.jpg`

- Source: NASA Goddard Space Flight Center Scientific Visualization Studio, "Equirectangular Projected Earth for LARGEST."
- File downloaded: `earth_noClouds.0330.jpg`, 2048x1024 JPEG.
- Source page: https://svs.gsfc.nasa.gov/3615/
- Direct source URL: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/earth_noClouds.0330.jpg
- Requested credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The Blue Marble Next Generation data is courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory.

### `assets/nasa/earth-with-clouds-2048.jpg`

- Source: NASA Goddard Space Flight Center Scientific Visualization Studio, "Equirectangular Projected Earth for LARGEST."
- File downloaded: `flat_earth03.jpg`, 2048x1024 JPEG.
- Source page: https://svs.gsfc.nasa.gov/3615/
- Direct source URL: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/flat_earth03.jpg
- Requested credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The Blue Marble Next Generation data is courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory.

The page derives an in-browser transparent cloud mask from the two SVS images above by comparing the with-clouds and no-clouds versions. No NASA logos or marks are included.

## Runtime Dependency

- Three.js r160 is stored locally as `assets/vendor/three.module.js`.
- Download URL: https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
- License file: `assets/vendor/three-LICENSE`.
- Three.js license: MIT, https://github.com/mrdoob/three.js/blob/dev/LICENSE.
