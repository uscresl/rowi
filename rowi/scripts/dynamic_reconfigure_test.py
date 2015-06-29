#!/usr/bin/env python

import rospy

from dynamic_reconfigure.server import Server
from rowi.cfg import TestConfig

def callback(config, level):
    # rospy.loginfo("""Reconfigure Request: {int_param}, {double_param},\
    #       {str_param}, {bool_param}, {size}""".format(**config))
    print config, level
    return config

if __name__ == "__main__":
    rospy.init_node("dynamic_reconfigure_test", anonymous = True)

    srv = Server(TestConfig, callback)
    rospy.spin()
