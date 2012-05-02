MODEL_FILE=/tmp/model.js

all: clean build-server build-clients build-utils build-apps

clean:
	rm -rf bin/
	mkdir bin

build-server:
	cp -r src/server/ bin/server
	cp -r lib/server bin/server/node_modules
	scripts/inject.py src/shared/model.js 'module.exports' bin/server/model.js

build-utils:
	cp -r src/auth-engine bin/auth-engine
	cp -r lib/auth-engine bin/auth-engine/node_modules
	cp -r bin/client/nodejs bin/auth-engine/heap.io
	cp bin/server/config.js bin/auth-engine/config.js

build-clients:
	cp -r src/client bin/client
	scripts/inject.py src/shared/model.js 'var model' bin/client/nodejs/heap.io.js
	scripts/inject.py src/shared/model.js 'var model' bin/client/web/heap.io.js

build-apps:
	cp -r apps bin/apps
	
	cp -r lib/apps bin/apps/test/lib
	cp -r lib/apps bin/apps/todo/static/lib
	
	cp lib/web/socket.io.min.js bin/apps/test/lib/socket.io.min.js
	cp lib/web/socket.io.min.js bin/apps/todo/static/lib/socket.io.min.js

	cp -r bin/client/web bin/apps/test/heap.io
	cp -r bin/client/web bin/apps/todo/static/heap.io
	cp -r bin/client/nodejs bin/apps/todo/dbdump/heap.io

run-seed:
	node bin/auth-engine/app bin/apps/seed.json &

run-server:
	node bin/server/app &

run-demo: run-server run-seed
	cd bin/apps/todo/static && python -m SimpleHTTPServer &
	node bin/apps/todo/dbdump/dbdump &

run-test: run-server run-seed
	cd bin/apps/test && python -m SimpleHTTPServer &

kill:
	-killall node
	-killall python