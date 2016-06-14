#!/usr/bin/env python

import rospy

from geometry_msgs.msg import Vector3Stamped
from std_msgs.msg import Float32
import random

def pub_rand_vector(pub):
	m = Vector3Stamped()
	m.header.stamp = rospy.Time.now()
	m.vector.x = random.random()
	m.vector.y = random.random()
	m.vector.z = random.random()

	pub.publish(m)

if __name__ == "__main__":
    rospy.init_node("dynamic_reconfigure_test", anonymous = True)

    pub1 = rospy.Publisher('/ns1/topic1', Vector3Stamped, queue_size=10)
    pub2 = rospy.Publisher('/ns1/topic2', Vector3Stamped, queue_size=10)
    pub3 = rospy.Publisher('/ns1/topic3', Vector3Stamped, queue_size=10)
    pub4 = rospy.Publisher('/ns1/topic4', Float32, queue_size=10)

    pubs = [pub1, pub2, pub3]
    factors = [1, 1, 5]

    rate = rospy.Rate(5.0)
    i = 0
    while not rospy.is_shutdown():
    	for j in range(len(pubs)):
    		if i%factors[j]==0:
    			pub_rand_vector(pubs[j])
    	i+=1
    	rate.sleep()
