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

### `assets/nasa/black-marble-2016-8192.jpg`

- Source: NASA Earth Observatory / NASA Science, Earth at Night/Black Marble flat maps.
- Source file downloaded: `BlackMarble_2016_3km.jpg`, 2016 color global 13500x6750 JPEG.
- Local processing: resized to 8192x4096 JPEG for broad WebGL texture compatibility.
- Source page: https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/
- Direct source URL: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg
- Credit: NASA Earth Observatory / NASA Science.

### `assets/nasa/earth-no-clouds-2048.jpg`

- Source: NASA Goddard Space Flight Center Scientific Visualization Studio, "Equirectangular Projected Earth for LARGEST."
- File downloaded: `earth_noClouds.0330.jpg`, 2048x1024 JPEG.
- Source page: https://svs.gsfc.nasa.gov/3615/
- Direct source URL: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/earth_noClouds.0330.jpg
- Requested credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The Blue Marble Next Generation data is courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory.

### `assets/nasa/earth-topography-8192.jpg`

- Source: NASA Earth Observatory / NASA Science, Blue Marble: Next Generation with Topography.
- Source file downloaded: `world.topo.200406.3x21600x10800.jpg`, June global topographic-shaded JPEG.
- Local processing: resized to 8192x4096 JPEG for broad WebGL texture compatibility.
- Source page: https://visibleearth.nasa.gov/images/74368/june-blue-marble-next-generation-w-topography
- Direct source URL: https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/june/world.topo.200406.3x21600x10800.jpg
- Credit: NASA Earth Observatory.

### `assets/nasa/earth-with-clouds-2048.jpg`

- Source: NASA Goddard Space Flight Center Scientific Visualization Studio, "Equirectangular Projected Earth for LARGEST."
- File downloaded: `flat_earth03.jpg`, 2048x1024 JPEG.
- Source page: https://svs.gsfc.nasa.gov/3615/
- Direct source URL: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/flat_earth03.jpg
- Requested credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The Blue Marble Next Generation data is courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory.

### `assets/nasa/earth-with-clouds-8192.jpg`

- Source: NASA Goddard Space Flight Center Scientific Visualization Studio, "Equirectangular Projected Earth for LARGEST."
- File downloaded: `flat_earth_Largest_still.0330.jpg`, 8192x4096 JPEG.
- Source page: https://svs.gsfc.nasa.gov/3615/
- Direct source URL: https://svs.gsfc.nasa.gov/vis/a000000/a003600/a003615/flat_earth_Largest_still.0330.jpg
- Requested credit: NASA/Goddard Space Flight Center Scientific Visualization Studio. The Blue Marble Next Generation data is courtesy of Reto Stockli (NASA/GSFC) and NASA's Earth Observatory.

### `assets/nasa/earth-clouds-alpha-8192.png`

- Source: Matteason Daily Cloud Maps, generated from NASA Global Imagery Browse Services (GIBS) data.
- File downloaded: `8192x4096-clouds-alpha.png`, 8192x4096 PNG with alpha transparency.
- Source page: https://github.com/matteason/daily-cloud-maps
- Direct source URL: https://matteason.github.io/daily-cloud-maps/8192x4096-clouds-alpha.png
- License: CC0 1.0 Universal for generated project images; source NASA data is public domain.
- Requested acknowledgement: imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Observing System Data and Information System (EOSDIS).

### `assets/nasa/earth-specular-8192.jpg`

- Source: Matteason Daily Cloud Maps, generated from NASA Global Imagery Browse Services (GIBS) data.
- File downloaded: `8192x4096-specular.jpg`, 8192x4096 JPEG.
- Source page: https://github.com/matteason/daily-cloud-maps
- Direct source URL: https://matteason.github.io/daily-cloud-maps/8192x4096-specular.jpg
- License: CC0 1.0 Universal for generated project images; source NASA data is public domain.
- Requested acknowledgement: imagery provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's Earth Observing System Data and Information System (EOSDIS).

The page derives an in-browser transparent cloud mask from the 2048px SVS images above by comparing the with-clouds and no-clouds versions. No NASA logos or marks are included.

## Fonts

### `assets/fonts/nasalization-rg.woff2`

- Source: Nasalization Regular by Typodermic Fonts (Ray Larabie), inspired by the 1975 NASA "worm" logotype.
- Source page: https://typodermicfonts.com/nasalization/
- Downloaded the freeware Regular weight (`Nasalization Rg.otf`), converted locally to woff2 with fontTools.
- License: Typodermic freeware desktop EULA for the Regular weight; used here on a personal site. Typodermic's full web license covers other weights/uses: https://typodermicfonts.com

## Runtime Dependency

- Three.js r160 is stored locally as `assets/vendor/three.module.js`.
- Download URL: https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js
- License file: `assets/vendor/three-LICENSE`.
- Three.js license: MIT, https://github.com/mrdoob/three.js/blob/dev/LICENSE.
