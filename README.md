ROWI - Robot Operations Web Interface
=====================================

ROWI is an extendable modular web interface for robot control & visualization for ROS.

# Design

Designed with field robotics in mind, its main module is a map module based on Leaflet-js which allows for geographic visualization of robots and data. The map can use tiles from variety of sources supported by Leaflet and its plugins. User provided "offline" cached tiles are also supported.

Some of our design guidelines & goals for ROWI:
+ Don't assume internet access is available (ability to have cached map tiles and use local copies of all assets).
+ Support visualization and control of multiple robot systems in one GUI.
+ Provide web based access to many ROS tools/functionality available.
+ Work on both computers and tablets (currently we don't test on phones).
+ Work on late versions of Chrome, Firefox, Chrome for Android & Safari for iOS.

# Plugins

ROWI supports plugins that can interact with the map, display information in the sidebar or in tabs.
Plugins can be defined in other packages and used by ROWI:
Directory structure of that package needs to be:

    package_name/
    package_name/plugin_name/
    package_name/plugin_name/html/
    package_name/plugin_name/html/plugin.js
    package_name/package.xml
    package_name/CMakeLists.txt

The package manifest (package.xml) needs to define an export:
    <export>
      <rowi plugin="plugin_name" />
    </export>
and also have define a run rependency on rowi:
    <run_depend>rowi</run_depend>

Multiple plugins can be defined in the same package.

Some existing plugins:
+ Dynamic Reconfigure
   Web based version of rtq_reconfigure. Allows for live editing of configuration of modules.
+ Diagnostic Monitor
   Web based version of rqt_robot_monitor.
+ Video
   Utilized web-video-server to display live feeds and snapshot from available camera topics.


# Running

Use the included start_webserver.py script that starts up a simple webserver, or use the collect.py script to deploy ROWI to a directory to serve with your own webserver.


# Configuration

ROWI can be configured using the config.js file included. start_webserver.py accepts a ~config parameter to define which config file to use. If deploying for another webserver, use -c option in collect.py or copy the config to the deploy directory.

# Documentation

ROWI is currently in early development and is lacking much documentation since API is very unstable.
