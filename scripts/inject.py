#!/usr/bin/python
import sys
import os

def main():
    inject_file = sys.argv[1]
    scope = sys.argv[2]
    file_path = sys.argv[3]

    inject_source = open(inject_file).read().replace("__inject_to__", scope)

    if os.path.exists(file_path):
        inject_file_name = os.path.basename(inject_file).split(".")[0]
        file_source = open(file_path).read().replace("__%s_source__" % inject_file_name, inject_source)
    else:
        file_source = inject_source

    handler = open(file_path, "w")
    handler.write(file_source)
    handler.close()

if __name__ == '__main__':
    main()