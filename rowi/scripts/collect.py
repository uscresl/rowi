#!/usr/bin/env python
PKG='rowi'

import os
import sys
import shutil

import argparse

import rospkg
import rowi

parser = argparse.ArgumentParser(description='Collect ROWI files to a directory. Use this script to deploy ROWI in to a directory and serve with a webserver.')
parser.add_argument('destination')
parser.add_argument('-c','--config',help="Config file to copy to new setup.")
parser.add_argument('-C','--create',action='store_true',help="Create directory if it does not exist.")
parser.add_argument('-o','--overwrite',action='store_true',help="Delete existing files at destination.")
parser.add_argument('-s','--simulate',action='store_true',help="Does not actually copy. Use with -v.")
parser.add_argument('-v','--verbose',action='store_true',help="Verbose.")
args = parser.parse_args()

dest = os.path.abspath(os.path.expanduser(args.destination))
print 'Collecting ROWI files to %s.' % dest

if not os.path.exists(dest):
    if args.create:
        print '%s does not exist, creating.'
        if not args.simulate:
            os.makedirs(dest)
    else:
        sys.exit('%s does not exist. Use -c to create. Aborting.' % dest)
elif not os.path.isdir(dest):
    sys.exit('%s already exists, but is not a directory. Aborting.' % dest)

if len(os.listdir(dest)) > 0:
    if args.overwrite:
        print '%s is not empty. Existing files will be overwritten.' % dest
    else:
        sys.exit('%s is not empty. Use -o to overwrite. Aborting.' % dest)

rospack = rospkg.RosPack()
wwwroot = os.path.join(rospack.get_path(PKG),'html')

ignore = shutil.ignore_patterns('.git','*.pyc')

def copy_contents(src, dst, verbose=False, overwrite=False, simulate=False, ignore=None):
    for f in os.listdir(src):
        _src = os.path.join(src,f)
        _dst = os.path.join(dst,f)

        if os.path.isfile(_src):
            if os.path.exists(_dst) and overwrite:
                if verbose:
                    print 'Deleting file: %s' % _dst
                if not simulate:
                    os.remove(_dst)

            if verbose:
                print 'Copying file: %s -> %s' % (_src,_dst)
            if not simulate:
                shutil.copy(_src, _dst)
        else:
            if os.path.exists(_dst) and overwrite:
                if verbose:
                    print 'Deleting directory: %s' % _dst
                if not simulate:
                    shutil.rmtree(_dst)
            if verbose:
                print 'Copying directory: %s -> %s' % (_src,_dst)
            if not simulate:
                shutil.copytree(_src, _dst, ignore=ignore)

copy_contents(wwwroot, dest, verbose=args.verbose, simulate=args.simulate, overwrite=args.overwrite, ignore=ignore)
#
# for f in os.listdir(wwwroot):
#     src = os.path.join(wwwroot,f)
#     dst = os.path.join(dest,f)
#
#     if os.path.isfile(src):
#         if os.path.exists(dst) and args.overwrite:
#             if args.verbose:
#                 print 'Deleting file: %s' % dst
#             if not args.simulate:
#                 os.remove(dst)
#
#         if args.verbose:
#             print 'Copying file: %s -> %s' % (src,dst)
#         if not args.simulate:
#             shutil.copy(src, dst)
#     else:
#         if os.path.exists(dst) and args.overwrite:
#             if args.verbose:
#                 print 'Deleting directory: %s' % dst
#             if not args.simulate:
#                 shutil.rmtree(dst)
#         if args.verbose:
#             print 'Copying directory: %s -> %s' % (src,dst)
#         if not args.simulate:
#             shutil.copytree(src, dst, ignore=ignore)

plugins = rowi.find_plugins()
for p in plugins:
    src = p['html_path']
    dst = os.path.join(dest,'plugins',p['name'])
    os.makedirs(dst)
    copy_contents(src, dst, verbose=args.verbose, simulate=args.simulate, overwrite=args.overwrite, ignore=ignore)

if args.config:
    src = args.config
    dst = os.path.join(dest,'config.js')
    if args.verbose:
        print 'Copying config file: %s -> %s' % (src, dst)
    if not args.simulate:
        shutil.copy(src, dst)

        
    # if os.path.exists(dst) and args.overwrite:
    #     if args.verbose:
    #         print 'Deleting directory: %s' % dst
    #     if not args.simulate:
    #         shutil.rmtree(dst)
    # if args.verbose:
    #     print 'Copying directory: %s -> %s' % (src,dst)
    # if not args.simulate:
    #     shutil.copytree(src, dst, ignore=ignore)
