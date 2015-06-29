PKG='rowi'

import os
import rospkg


def find_plugins():
    """
    Find ROWI plugins defined by other packages.
    """
    rospack = rospkg.RosPack()
    packages = rospack.get_depends_on(PKG)
    res = []
    for pkg in packages:
        path = rospack.get_path(pkg)
        manifest = rospack.get_manifest(pkg)
        for plugin in manifest.get_export(PKG,'plugin'):
            plugin_path = os.path.join(path,'plugins',plugin)
            html_path = os.path.join(plugin_path,'html')
            res.append({'name': plugin, 'pkg': pkg, 'html_path': html_path, 'path': plugin_path})
    return res


if __name__ == '__main__':
    print find_plugins()
