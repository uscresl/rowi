cmake_minimum_required(VERSION 2.8.3)
project(rowi)

find_package(catkin REQUIRED COMPONENTS rospy dynamic_reconfigure driver_base)

catkin_python_setup()
generate_dynamic_reconfigure_options(
  cfg/Config.cfg
)

catkin_package(
    DEPENDS rospy
    CATKIN_DEPENDS # TODO
    INCLUDE_DIRS # TODO include
    LIBRARIES # TODO
)
