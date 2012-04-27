import sys
import os

MODEL_FILE = "src/shared/model.js"

def main():
    scope = sys.argv[1]
    file_path = sys.argv[2]

    model_source = open(MODEL_FILE).read().replace("__scope__", scope)
    file_source = open(file_path).read().replace("__model__", model_source) if os.path.exists(file_path) else model_source

    handler = open(file_path, "w")
    handler.write(file_source)
    handler.close()

if __name__ == '__main__':
    main()