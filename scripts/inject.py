#!/usr/bin/python
import sys
import os

def main():
    inject_file = sys.argv[1]
    scope = sys.argv[2]
    file_path = sys.argv[3]

    inject_source = open(inject_file).read().replace("__inject_to__", scope)
    file_source = open(file_path).read().replace("__inject_source__", inject_source) if os.path.exists(file_path) else inject_source

    handler = open(file_path, "w")
    handler.write(file_source)
    handler.close()

if __name__ == '__main__':
    main()