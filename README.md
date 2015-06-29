ROWI - Robot Operations Web Interface
=====================================

ROWI is am extendable modular web interface for robot control & visualization for ROS.

Designed with field robotics in mind, its main module is a map module based on Leaflet-js which allows for geographic visualization of robots and data. The map can use tiles from variety of sources supported by Leaflet and its plugins. User provided "offline" cached tiles are also supported.

ROWI supports plugins that can interact with the map, display information in the sidebar or in tabs.
Plugins can be defined in other packages and used by ROWI:
Directory structure of that package needs to be:

    package_name/
    package_name/html/
    package_name/html/plugin_name/
    package_name/html/plugin_name/plugin.js
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
